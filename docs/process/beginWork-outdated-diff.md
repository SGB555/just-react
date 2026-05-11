# beginWork 章节过时知识点差异检查

> 本文件仅用于审阅 `docs/process/beginWork.md` 的潜在过时点，不直接修改原章节。
>
> 对照基准：原章节引用的 React 源码快照为 `1fb18e22...`；当前对照 React 19.2 / `facebook/react` main 分支源码。整体流程仍然成立，但若希望面向 React 18/19 更新，需要调整下列表述。

## 1. 源码文件名已经变化

### 原文说法

章节多处链接到：

```text
ReactFiberBeginWork.new.js
ReactFiberWorkLoop.new.js
ReactChildFiber.new.js
ReactSideEffectTags.js
```

并提到：

```text
可以从源码这里看到 beginWork 的定义。整个方法大概有 500 行代码。
```

### 现在更准确的说法

当前 React 源码已经不再使用 `.new.js` / `.old.js` 这一组文件命名，相关文件变为：

```text
packages/react-reconciler/src/ReactFiberBeginWork.js
packages/react-reconciler/src/ReactFiberWorkLoop.js
packages/react-reconciler/src/ReactChildFiber.js
packages/react-reconciler/src/ReactFiberFlags.js
```

同时，`beginWork` 所在文件和内部逻辑已经显著扩展，包含 Suspense、Offscreen、Cache、Activity、ViewTransition 等更多分支；“整个方法大概 500 行代码”不再适合作为当前版本描述。

### 建议改法

如果正文仍以旧快照讲解，可以明确写成：

```text
本文基于 React 某个历史提交讲解，当前 React 19 源码文件名和分支数量已有变化。
```

如果正文要面向新版 React，则把源码链接更新到 `ReactFiberBeginWork.js`，并删除或弱化“500 行代码”的具体行数描述。

## 2. bailout 条件的表述需要补充 context / DidCapture 路径

### 原文说法

原文将 `didReceiveUpdate === false` 的主要条件概括为：

```text
1. oldProps === newProps && workInProgress.type === current.type
2. !includesSomeLane(renderLanes, updateLanes)
```

并用如下简化代码说明：

```js
} else if (!includesSomeLane(renderLanes, updateLanes)) {
  didReceiveUpdate = false;
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
```

### 现在更准确的说法

当前 `beginWork` 仍然先比较 `oldProps` / `newProps`、legacy context、热更新下的 type 变化。但是否能 early bailout 已经被封装进：

```js
const hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(
  current,
  renderLanes
);
```

并且还会检查：

```js
(workInProgress.flags & DidCapture) === NoFlags
```

也就是说，当前逻辑不只是看当前 Fiber 的 lanes 是否覆盖 `renderLanes`，还包括 context change、Suspense / error boundary 捕获后的第二轮渲染等情况。

### 建议改法

将“优先级不够就 bailout”改成更稳妥的表述：

```text
如果 props / legacy context / 热更新 type 都没有变化，并且当前 Fiber 没有与本次 renderLanes 匹配的 update 或 context 变化，同时不处于捕获错误或 Suspense 后的二次渲染路径，React 才会尝试 early bailout。
```

## 3. `effectTag` 已更名为 `flags`

### 原文说法

原文使用了旧字段：

```text
fiber.effectTag
ReactSideEffectTags.js
Placement effectTag
```

并举例：

```js
export const Placement = 0b00000000000010;
export const Update = 0b00000000000100;
export const PlacementAndUpdate = 0b00000000000110;
export const Deletion = 0b00000000001000;
```

### 现在更准确的说法

当前 React 使用：

```text
fiber.flags
fiber.subtreeFlags
fiber.deletions
ReactFiberFlags.js
```

常见 flag 包括：

```js
Placement
Update
ChildDeletion
Ref
Passive
```

旧的 `PlacementAndUpdate` 组合常量不再作为独立导出使用；删除也不再是给被删除 Fiber 标记 `Deletion`，而是父 Fiber 记录 `deletions` 数组，并在父 Fiber 上打 `ChildDeletion`。

### 建议改法

如果更新正文，建议把这一节标题从：

```text
effectTag
```

改为：

```text
flags
```

并将核心解释更新为：

```text
render 阶段会在 Fiber 上记录 flags / subtreeFlags / deletions，commit 阶段据此执行插入、更新、删除、ref、effect 等操作。
```

## 4. `mountChildFibers` / `reconcileChildFibers` 的差异仍成立，但措辞要换成 flags

### 原文说法

```text
mountChildFibers 与 reconcileChildFibers 逻辑基本一致。唯一的区别是：reconcileChildFibers 会为生成的 Fiber 节点带上 effectTag 属性，而 mountChildFibers 不会。
```

### 现在更准确的说法

这个核心结论仍然基本成立：两者仍然由 `createChildReconciler(shouldTrackSideEffects)` 生成，差异是是否追踪副作用。

但当前应写成：

```text
reconcileChildFibers 会追踪副作用，必要时设置 flags / deletions；mountChildFibers 不追踪插入、删除、移动等副作用。
```

注意：当前 mount 路径在 hydration / `useId` 相关场景下也可能设置一些非 DOM mutation 的标记，例如 `Forked`。所以不宜绝对写成“不会设置任何 flag”。

### 建议改法

把“唯一的区别”弱化为“核心区别”：

```text
二者核心区别在于是否追踪用于 commit 阶段的副作用。
```

## 5. 首屏 mount 的 Placement 解释需要修正

### 原文说法

```text
在 mount 时只有 rootFiber 会赋值 Placement effectTag，在 commit 阶段只会执行一次插入操作。
```

后文又说明：

```text
rootFiber 在 reconcileChildren 时会走 reconcileChildFibers 逻辑。
而之后通过 beginWork 创建的 Fiber 节点不存在 current，会走 mountChildFibers 逻辑。
```

### 现在更准确的说法

“只有 rootFiber 会赋值 Placement”这个说法不够准确。由于初次渲染时 HostRoot / rootFiber 通常存在 `current`，它在 `reconcileChildren` 中会走 `reconcileChildFibers`，因此被创建出来的顶层子 Fiber 会被标记 `Placement`。

之后这棵新子树内部的节点走 `mountChildFibers`，不会给每个新节点都追踪插入副作用。commit 阶段处理顶层 `Placement` 时，会把其下方已经在 `completeWork` 中构建好的 host 子树一次性插入宿主容器。

### 建议改法

建议改成：

```text
初次渲染时，HostRoot 因为存在 alternate，会通过 reconcileChildFibers 创建顶层子 Fiber，并为需要插入的顶层子树标记 Placement。顶层子树内部的后续 mount 路径通常通过 mountChildFibers 创建，不会为每个后代都标记 Placement。因此 commit 阶段可以围绕顶层插入点完成整棵 host 子树的插入，避免逐个节点重复插入。
```

## 6. 新增的 Fiber tag 分支没有覆盖

### 原文说法

原文列举常见 tag：

```text
IndeterminateComponent
LazyComponent
FunctionComponent
ClassComponent
HostRoot
HostComponent
HostText
```

### 现在更准确的说法

这些常见分支仍存在，但当前 React 的 `beginWork` 已包含更多分支或新版能力相关分支，例如：

```text
OffscreenComponent
CacheComponent
TracingMarkerComponent
ActivityComponent
ViewTransitionComponent
HostHoistable
HostSingleton
```

### 建议改法

无需在本章展开这些新分支，但可以补一句版本提示：

```text
随着 Suspense、Offscreen、Cache、Activity、ViewTransition 等能力加入，当前 beginWork 的 tag 分支比本文示例更多；本文只关注最常见组件类型的主干流程。
```

## 总体结论

这章的主线仍然可用：

- `beginWork` 负责向下处理 Fiber，并生成或复用子 Fiber。
- `current === null` 仍是理解 mount / update 路径的重要入口。
- `reconcileChildren` 仍是连接 `beginWork` 与子节点 diff 的关键函数。
- `mountChildFibers` 与 `reconcileChildFibers` 的核心区别仍是是否追踪 commit 所需副作用。

但如果面向 React 18/19 更新，建议优先处理：

1. 将 `effectTag` 全部更新为 `flags`。
2. 将 `ReactSideEffectTags.js` 更新为 `ReactFiberFlags.js`。
3. 将 `.new.js` 源码链接更新为无后缀文件。
4. 修正“只有 rootFiber 有 Placement”的说法。
5. 将 bailout 条件从单纯 lanes 判断改成包含 update / context / DidCapture 的新版描述。
