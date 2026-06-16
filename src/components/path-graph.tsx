"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { assetKey, assetLabel } from "@/types/path";
import type { AssetRef, Path } from "@/types/path";

type NodeRole = "source" | "hop" | "destination";

interface NodeData {
  label: string;
  role: NodeRole;
  index?: number;
}

function AssetNode({ data }: NodeProps<NodeData>) {
  const accent =
    data.role === "hop"
      ? "border-slate-700 bg-slate-900"
      : "border-emerald-500 bg-emerald-500/10";
  const tag =
    data.role === "source"
      ? "From"
      : data.role === "destination"
        ? "To"
        : `Hop ${data.index ?? ""}`;

  return (
    <div
      className={`min-w-[120px] rounded-lg border px-4 py-3 text-center ${accent}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-slate-600"
      />
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {tag}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{data.label}</p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-slate-600"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { asset: AssetNode };

function formatRate(rate: string): string {
  const n = Number(rate);
  if (!Number.isFinite(n)) return rate; // e.g. "N/A"
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
}

interface Props {
  path: Path;
  height?: number;
}

function buildGraph(path: Path): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const chain: AssetRef[] = [path.source, ...path.hops, path.destination];
  const spacing = 220;

  const nodes: Node<NodeData>[] = chain.map((asset, i) => {
    const role: NodeRole =
      i === 0 ? "source" : i === chain.length - 1 ? "destination" : "hop";
    return {
      id: `${i}-${assetKey(asset)}`,
      type: "asset",
      position: { x: i * spacing, y: 0 },
      data: {
        label: assetLabel(asset),
        role,
        index: role === "hop" ? i : undefined,
      },
    };
  });

  const edges: Edge[] = nodes.slice(1).map((node, i) => {
    const rate = path.hopRates?.[i];
    return {
      id: `e-${i}`,
      source: nodes[i].id,
      target: node.id,
      animated: true,
      label: rate ? formatRate(rate) : undefined,
      labelShowBg: true,
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "#0f172a", stroke: "#1e293b" },
      labelStyle: { fill: "#34d399", fontSize: 11, fontWeight: 600 },
      style: { stroke: "#10b981", strokeWidth: 1.5 },
    };
  });

  return { nodes, edges };
}

export function PathGraph({ path, height = 240 }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(path), [path]);

  return (
    <div
      className="w-full rounded-xl border border-slate-800 bg-slate-950"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
      >
        <Background color="#1e293b" gap={20} />
        <Controls
          showInteractive={false}
          className="!border-slate-800 !bg-slate-900"
        />
      </ReactFlow>
    </div>
  );
}
