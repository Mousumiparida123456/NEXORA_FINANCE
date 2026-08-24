import React, { useState, useMemo } from "react";
import {
  Users,
  Smartphone,
  CreditCard,
  MapPin,
  Globe,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Info,
  Filter,
  X,
  Search,
  ExternalLink,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  abuseNetworkService,
  NetworkNode,
  NetworkEdge,
  NetworkNodeType,
} from "../services/abuseNetworkService";

export function AbuseNetworkGraph() {
  const { nodes, edges, insights } = useMemo(() => abuseNetworkService.getDemoAbuseNetwork(), []);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("NODE-ADDR-01");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [onlySuspicious, setOnlySuspicious] = useState<boolean>(false);

  // Selected node
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>([selectedNodeId]);
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) set.add(edge.target);
      if (edge.target === selectedNodeId) set.add(edge.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (filterType !== "ALL" && node.type !== filterType) return false;
      if (onlySuspicious && !node.isFlagged) return false;
      return true;
    });
  }, [nodes, filterType, onlySuspicious]);

  const getNodeIcon = (type: NetworkNodeType) => {
    switch (type) {
      case "CUSTOMER":
        return <Users className="h-4 w-4" />;
      case "DEVICE":
        return <Smartphone className="h-4 w-4" />;
      case "PAYMENT":
        return <CreditCard className="h-4 w-4" />;
      case "ADDRESS":
        return <MapPin className="h-4 w-4" />;
      case "IP":
        return <Globe className="h-4 w-4" />;
      case "TRANSACTION":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getNodeColor = (type: NetworkNodeType, isFlagged: boolean) => {
    if (isFlagged) {
      switch (type) {
        case "ADDRESS":
          return "bg-rose-500 text-white ring-rose-500/50";
        case "PAYMENT":
          return "bg-amber-500 text-slate-950 ring-amber-500/50";
        case "DEVICE":
          return "bg-purple-500 text-white ring-purple-500/50";
        case "IP":
          return "bg-blue-500 text-white ring-blue-500/50";
        default:
          return "bg-red-600 text-white ring-red-500/50";
      }
    }
    return "bg-slate-800 text-slate-300 ring-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Demo Data Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{insights.title}</h2>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                DEMO DATA ONLY
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{insights.description}</p>
          </div>
        </div>

        {/* Aggregate Exposure Metrics */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-lg border border-slate-800 text-xs shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 block">Total Associated Exposure</span>
            <span className="font-mono font-bold text-rose-400">
              ₹2.84 Lakhs <span className="text-slate-400 text-[10px]">(${insights.totalExposureUSD.toLocaleString()})</span>
            </span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 block">Cluster Breakdown</span>
            <span className="font-semibold text-slate-200 text-[11px]">
              {insights.customerCount} Users · {insights.deviceCount} Dev · {insights.paymentCount} Cards · {insights.addressCount} Address
            </span>
          </div>
        </div>
      </div>

      {/* Main Graph Workspace Container */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Interactive SVG Graph Canvas */}
        <div className="md:col-span-8 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-4 flex flex-col justify-between min-h-[520px] relative overflow-hidden">
          {/* Top Canvas Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 z-10 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter Nodes:
              </span>
              {[
                { label: "All", value: "ALL" },
                { label: "Customers", value: "CUSTOMER" },
                { label: "Devices", value: "DEVICE" },
                { label: "Cards", value: "PAYMENT" },
                { label: "Addresses", value: "ADDRESS" },
                { label: "IPs", value: "IP" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilterType(item.value)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    filterType === item.value
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlySuspicious}
                onChange={(e) => setOnlySuspicious(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0"
              />
              Flagged Nodes Only
            </label>
          </div>

          {/* SVG Canvas Render Area */}
          <div className="relative w-full h-[440px] rounded-lg bg-[#070d1e] border border-slate-900 overflow-hidden flex items-center justify-center">
            {/* Background Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* SVG Edges Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                const targetNode = nodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isConnectedToSelected =
                  selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

                return (
                  <line
                    key={edge.id}
                    x1={`${sourceNode.x}%`}
                    y1={`${sourceNode.y}%`}
                    x2={`${targetNode.x}%`}
                    y2={`${targetNode.y}%`}
                    stroke={
                      isConnectedToSelected
                        ? "#f43f5e"
                        : edge.isSuspicious
                        ? "#f59e0b"
                        : "#334155"
                    }
                    strokeWidth={isConnectedToSelected ? 2.5 : edge.isSuspicious ? 1.5 : 1}
                    strokeDasharray={edge.isSuspicious ? "4 3" : "none"}
                    opacity={selectedNodeId ? (isConnectedToSelected ? 1 : 0.2) : 0.7}
                  />
                );
              })}
            </svg>

            {/* Interactive Nodes Layer */}
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isConnected = connectedNodeIds.has(node.id);
              const opacity = selectedNodeId ? (isConnected ? 1 : 0.25) : 1;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    opacity,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 group ${
                    isSelected ? "scale-125 z-30" : "hover:scale-110"
                  }`}
                >
                  <div
                    className={`h-11 w-11 rounded-full flex items-center justify-center ring-4 transition-all shadow-xl ${getNodeColor(
                      node.type,
                      node.isFlagged
                    )} ${isSelected ? "ring-white shadow-rose-500/50" : ""}`}
                  >
                    {getNodeIcon(node.type)}
                  </div>

                  {/* Node Hover Label */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium bg-slate-950/90 text-slate-200 px-2 py-0.5 rounded border border-slate-800 shadow pointer-events-none group-hover:block transition-all">
                    {node.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graph Footer Disclaimer */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 z-10">
            <span>Click any node to inspect relationship graph & risk dossier</span>
            <span className="font-mono text-[10px] text-purple-400">{insights.disclaimer}</span>
          </div>
        </div>

        {/* Right Column: Node Details & Relationship Drawer */}
        <div className="md:col-span-4 rounded-xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {getNodeIcon(selectedNode.type)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{selectedNode.label}</h3>
                    <p className="text-[10px] text-slate-400">{selectedNode.sublabel}</p>
                  </div>
                </div>
                <Badge
                  className={
                    selectedNode.riskScore >= 86
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : selectedNode.riskScore >= 71
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }
                >
                  {selectedNode.riskScore} · Risk
                </Badge>
              </div>

              {/* Node Details Fields */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Entity Type</span>
                  <span className="font-semibold text-slate-200">{selectedNode.type}</span>
                </div>

                {selectedNode.details.country && (
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Geo Location / IP</span>
                    <span className="font-semibold text-slate-200">{selectedNode.details.country}</span>
                  </div>
                )}

                {selectedNode.details.notes && (
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Signal Intelligence Note</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">{selectedNode.details.notes}</span>
                  </div>
                )}
              </div>

              {/* Connected Entities in Network */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Directly Linked Entities ({connectedNodeIds.size - 1}):
                </span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => {
                      const linkedId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const linkedNode = nodes.find((n) => n.id === linkedId);
                      if (!linkedNode) return null;

                      return (
                        <div
                          key={edge.id}
                          onClick={() => setSelectedNodeId(linkedNode.id)}
                          className="p-2.5 bg-slate-950/40 hover:bg-slate-800/60 rounded-lg border border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">{getNodeIcon(linkedNode.type)}</span>
                            <div>
                              <p className="font-medium text-slate-200">{linkedNode.label}</p>
                              <p className="text-[10px] text-slate-500">{edge.relationship}</p>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-rose-400">
                            {linkedNode.riskScore}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2 p-6">
              <Info className="h-8 w-8 text-slate-600" />
              <p className="text-xs">Select any node in the graph to inspect entity details & linked accounts</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>Synthetic Demonstration Data</span>
            <span className="text-emerald-400">Sentinel Graph v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
