import React from "react";
import { ReactFlow, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useReactFlowModel } from "../useReactFlowModel";
import SignalNode from "../nodes/SignalNode";
import ActivityNode from "../nodes/ActivityNode";
import JunctionNode from "../nodes/JunctionNode";
import ConstraintEdge from "../edges/ConstraintEdge";
import MemberEdge from "../edges/MemberEdge";

const nodeTypes = { signal: SignalNode, activity: ActivityNode, junction: JunctionNode };
const edgeTypes = { constraint: ConstraintEdge, member: MemberEdge };

export default function Canvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgeClick,
    onNodeClick,
    onConnect,
    onConnectStart,
    onConnectEnd,
  } = useReactFlowModel();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgeClick={onEdgeClick}
      onNodeClick={onNodeClick}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      deleteKeyCode={null}
      selectionKeyCode={null}
      multiSelectionKeyCode={null}
      panOnDrag
      selectNodesOnDrag={false}
      nodesDraggable
      elementsSelectable
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} color="#E7E7EA" />
    </ReactFlow>
  );
}
