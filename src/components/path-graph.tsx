"use client";

import { useId, useMemo, useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";
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

  const edges: Edge[] = nodes.slice(1).map((node, i) => ({
    id: `e-${i}`,
    source: nodes[i].id,
    target: node.id,
    animated: true,
    style: { stroke: "#10b981", strokeWidth: 1.5 },
  }));

  return { nodes, edges };
}

export function PathGraph({ path, height = 240 }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(path), [path]);
  const accountId = useId();
  const [account, setAccount] = useState("");

  const trimmedAccount = account.trim();
  const accountValid = StrKey.isValidEd25519PublicKey(trimmedAccount);
  const showAccountError = trimmedAccount.length > 0 && !accountValid;

  return (
    <div className="space-y-4">
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

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={accountId}
          className="text-xs font-medium uppercase tracking-wider text-slate-400"
        >
          Source account
        </label>
        <input
          id={accountId}
          type="text"
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          placeholder="G…"
          spellCheck={false}
          autoCapitalize="off"
          aria-invalid={showAccountError}
          className={
            "rounded-lg border bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-600 transition-colors focus:outline-none " +
            (showAccountError
              ? "border-rose-700 focus:border-rose-500"
              : "border-slate-800 focus:border-emerald-500")
          }
        />
        {showAccountError ? (
          <p className="text-xs text-rose-400">
            Enter a valid Stellar account address starting with G.
          </p>
        ) : null}
      </div>
    </div>
  );
}
