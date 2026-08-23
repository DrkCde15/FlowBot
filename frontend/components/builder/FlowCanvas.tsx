"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Block } from "@/lib/flow";
import BlockNode from "./BlockNode";

const nodeTypes = { block: BlockNode };

type FlowNode = Node<{ block: Block; selected?: boolean }>;

function buildEdges(flow: Block[]): Edge[] {
  const out: Edge[] = [];
  for (const b of flow) {
    if (b.next)
      out.push({ id: `next::${b.id}`, source: b.id, target: b.next });
    for (const br of b.branches || []) {
      if (br.next)
        out.push({
          id: `branch::${b.id}::${br.id}`,
          source: b.id,
          sourceHandle: br.id,
          target: br.next,
          animated: true,
          label: br.value || br.operator || "",
          style: { stroke: "#f59e0b" },
          labelStyle: { fill: "#b45309", fontSize: 10 },
        });
    }
  }
  return out;
}

export default function FlowCanvas({
  flow,
  setFlow,
  onSelect,
}: {
  flow: Block[];
  setFlow: React.Dispatch<React.SetStateAction<Block[]>>;
  onSelect: (id: string | null) => void;
}) {
  const initialNodes = useMemo<FlowNode[]>(
    () =>
      flow.map((b) => ({
        id: b.id,
        type: "block",
        position: { x: b.x ?? 0, y: b.y ?? 0 },
        data: { block: b },
      })),
    // only for first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialEdges = useMemo<Edge[]>(() => buildEdges(flow), []);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<Edge>(initialEdges);

  // Keep nodes/edges in sync with the parent flow (content, structure),
  // but preserve live node positions so dragging never re-renders all cards.
  useEffect(() => {
    setNodes((nds) => {
      const byId = new Map(nds.map((n) => [n.id, n]));
      return flow.map((b) => {
        const existing = byId.get(b.id);
        return {
          id: b.id,
          type: "block" as const,
          position: existing ? existing.position : { x: b.x ?? 0, y: b.y ?? 0 },
          data: { block: b },
        };
      });
    });
    setEdges(buildEdges(flow));
  }, [flow, setNodes, setEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      for (const c of changes) {
        if (c.type === "remove") {
          setFlow((f) =>
            f
              .filter((b) => b.id !== c.id)
              .map((b) => ({
                ...b,
                next: b.next === c.id ? null : b.next,
                branches: (b.branches || []).map((br) =>
                  br.next === c.id ? { ...br, next: null } : br
                ),
              }))
          );
        } else if (c.type === "select") {
          if (c.selected) onSelect(c.id);
        }
      }
    },
    [setNodes, setFlow, onSelect]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      for (const c of changes) {
        if (c.type === "remove") {
          const parts = c.id.split("::");
          const srcId = parts[1];
          const brId = parts[2];
          setFlow((f) =>
            f.map((b) => {
              if (b.id !== srcId) return b;
              if (!brId) return { ...b, next: null };
              return {
                ...b,
                branches: (b.branches || []).map((br) =>
                  br.id === brId ? { ...br, next: null } : br
                ),
              };
            })
          );
        }
      }
    },
    [setEdges, setFlow]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) => addEdge(conn, eds));
      const { source, target, sourceHandle } = conn;
      if (!source || !target) return;
      setFlow((f) =>
        f.map((b) => {
          if (b.id !== source) return b;
          if (!sourceHandle || sourceHandle === "next")
            return { ...b, next: target };
          return {
            ...b,
            branches: (b.branches || []).map((br) =>
              br.id === sourceHandle ? { ...br, next: target } : br
            ),
          };
        })
      );
    },
    [setEdges, setFlow]
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: FlowNode) => {
      setFlow((f) =>
        f.map((b) =>
          b.id === node.id
            ? { ...b, x: node.position.x, y: node.position.y }
            : b
        )
      );
    },
    [setFlow]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDragStop={onNodeDragStop}
      onPaneClick={() => onSelect(null)}
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-gray-50"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <MiniMap pannable zoomable className="!bg-white" />
      <Controls />
    </ReactFlow>
  );
}
