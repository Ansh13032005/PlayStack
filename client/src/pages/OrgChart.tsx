import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import {
  Loader2, UserCircle, ZoomIn, ZoomOut, RotateCcw, ChevronDown, ChevronUp,
  X, Search, Mail, Phone, Briefcase, Building2, Users, UserCheck,
} from 'lucide-react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';

interface OrgNode {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation?: string;
  role: string;
  department?: string | { name: string };
  profileImage?: string;
  email?: string;
  phone?: string;
  status?: string;
  children: OrgNode[];
}

// Helper to get department name whether it's a string or object
function getDeptName(dept: OrgNode['department']): string | undefined {
  if (!dept) return undefined;
  if (typeof dept === 'string') return dept;
  return dept.name;
}

// Count total nodes in the tree
function countNodes(nodes: OrgNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

// Check if node or any descendant matches search
function nodeMatchesSearch(node: OrgNode, q: string): boolean {
  const term = q.toLowerCase();
  const fullName = `${node.firstName} ${node.lastName}`.toLowerCase();
  return (
    fullName.includes(term) ||
    (node.designation?.toLowerCase() ?? '').includes(term) ||
    (node.role?.toLowerCase() ?? '').includes(term) ||
    (getDeptName(node.department)?.toLowerCase() ?? '').includes(term) ||
    node.employeeId.toLowerCase().includes(term)
  );
}

// ─── Detail Side Panel ───────────────────────────────────────────────────────
function EmployeeDetailPanel({ node, onClose }: { node: OrgNode; onClose: () => void }) {
  const roleAccent: Record<string, string> = {
    'Super Admin': 'from-violet-600 to-purple-700',
    'HR Manager': 'from-blue-500 to-cyan-600',
    Employee: 'from-emerald-500 to-teal-600',
  };
  const gradient = roleAccent[node.role] ?? 'from-gray-600 to-gray-800';

  return (
    <div className="absolute right-4 top-4 bottom-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-20 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} p-6 relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          {node.profileImage ? (
            <img
              src={node.profileImage}
              alt=""
              className="w-16 h-16 rounded-full border-4 border-white/30 object-cover mb-3 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-white font-bold text-xl">
                {node.firstName.charAt(0)}{node.lastName.charAt(0)}
              </span>
            </div>
          )}
          <h3 className="text-white font-bold text-base leading-tight">
            {node.firstName} {node.lastName}
          </h3>
          <p className="text-white/80 text-xs mt-0.5">{node.designation || node.role}</p>
          <span className="mt-2 text-[10px] bg-white/20 text-white px-3 py-0.5 rounded-full font-medium">
            {node.role}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        <InfoRow icon={<UserCheck className="w-4 h-4" />} label="Employee ID" value={node.employeeId} />
        {node.email && <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={node.email} />}
        {node.phone && <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={node.phone} />}
        {getDeptName(node.department) && (
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Department" value={getDeptName(node.department)!} />
        )}
        {node.designation && (
          <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Designation" value={node.designation} />
        )}
        {node.children.length > 0 && (
          <InfoRow icon={<Users className="w-4 h-4" />} label="Direct Reports" value={`${node.children.length} ${node.children.length === 1 ? 'person' : 'people'}`} />
        )}

        {node.status && (
          <div className="pt-2 border-t border-gray-100">
            <span className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
              node.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', node.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400')} />
              {node.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────
function EmployeeCard({
  node,
  isCollapsed,
  onToggle,
  onSelect,
  isSelected,
  isHighlighted,
  searchActive,
}: {
  node: OrgNode;
  isCollapsed: boolean;
  onToggle: () => void;
  onSelect: (n: OrgNode) => void;
  isSelected: boolean;
  isHighlighted: boolean;
  searchActive: boolean;
}) {
  const hasChildren = node.children && node.children.length > 0;

  const roleBorder: Record<string, string> = {
    'Super Admin': 'border-t-4 border-t-violet-500',
    'HR Manager': 'border-t-4 border-t-blue-500',
    Employee: 'border-t-4 border-t-emerald-500',
  };

  const topBorder = roleBorder[node.role] ?? 'border-t-4 border-t-gray-300';

  const dimmed = searchActive && !isHighlighted;

  return (
    <div className={cn('flex flex-col items-center select-none transition-opacity duration-200', dimmed && 'opacity-30')}>
      <div
        onClick={() => onSelect(node)}
        className={cn(
          'bg-white border border-gray-200 rounded-xl p-4 w-52 shadow-md',
          'hover:shadow-xl hover:border-gray-300',
          'transition-all duration-200 cursor-pointer',
          'flex flex-col items-center text-center gap-2',
          topBorder,
          isSelected && 'ring-2 ring-primary-500 shadow-xl border-primary-300',
          isHighlighted && searchActive && 'ring-2 ring-amber-400 shadow-lg',
        )}
      >
        {/* Avatar */}
        {node.profileImage ? (
          <img
            src={node.profileImage}
            alt=""
            className="w-14 h-14 rounded-full border-2 border-gray-100 object-cover shadow-sm"
          />
        ) : (
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center shadow-sm',
            node.role === 'Super Admin' ? 'bg-gradient-to-br from-violet-400 to-purple-600' :
            node.role === 'HR Manager' ? 'bg-gradient-to-br from-blue-400 to-cyan-600' :
            'bg-gradient-to-br from-emerald-400 to-teal-600'
          )}>
            <span className="text-white font-bold text-lg">
              {node.firstName.charAt(0)}{node.lastName.charAt(0)}
            </span>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {node.firstName} {node.lastName}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {node.designation || node.role}
          </p>
        </div>

        {getDeptName(node.department) && (
          <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full truncate max-w-full">
            {getDeptName(node.department)}
          </span>
        )}
      </div>

      {/* Toggle button */}
      {hasChildren && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            'mt-1 flex items-center gap-1 px-3 py-0.5 rounded-full z-10',
            'bg-white border border-gray-200 shadow-sm',
            'text-[10px] font-semibold text-gray-600',
            'hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700',
            'transition-colors duration-150'
          )}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="w-3 h-3" />
              {node.children.length} report{node.children.length > 1 ? 's' : ''}
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3" />
              Collapse
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Tree Node (recursive) ───────────────────────────────────────────────────
function TreeNode({
  node,
  onSelect,
  selectedId,
  searchQuery,
}: {
  node: OrgNode;
  onSelect: (n: OrgNode) => void;
  selectedId: string | null;
  searchQuery: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node._id;
  const isHighlighted = searchQuery.length > 0 && nodeMatchesSearch(node, searchQuery);
  const searchActive = searchQuery.length > 0;

  return (
    <div className="flex flex-col items-center">
      <EmployeeCard
        node={node}
        isCollapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onSelect={onSelect}
        isSelected={isSelected}
        isHighlighted={isHighlighted}
        searchActive={searchActive}
      />

      {hasChildren && !collapsed && (
        <>
          {/* Stem down */}
          <div className="w-px h-8 bg-gray-300" />

          <div className="relative flex">
            {node.children.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              const isOnly = node.children.length === 1;
              return (
                <div
                  key={child._id}
                  className="flex flex-col items-center px-6 relative"
                >
                  {!isOnly && (
                    <div
                      className="absolute top-0 h-px bg-gray-300"
                      style={{
                        left: isFirst ? '50%' : 0,
                        right: isLast ? '50%' : 0,
                      }}
                    />
                  )}
                  <div className="w-px h-8 bg-gray-300" />
                  <TreeNode
                    node={child}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    searchQuery={searchQuery}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── OrgChart Page ───────────────────────────────────────────────────────────
export function OrgChart() {
  const [scale, setScale] = useState(0.85);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: tree, isLoading, isError } = useQuery<OrgNode[]>({
    queryKey: ['orgTree'],
    queryFn: async () => {
      const res = await api.get('/organization/tree');
      return res.data.data;
    },
  });

  const totalEmployees = useMemo(() => tree ? countNodes(tree) : 0, [tree]);
  const rootCount = tree?.length ?? 0;

  // ── Pan ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-card]')) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const stopPan = useCallback(() => { isPanning.current = false; }, []);

  // ── Scroll to zoom ──
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.min(2, Math.max(0.3, prev - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const resetView = () => { setScale(0.85); setTranslate({ x: 0, y: 0 }); };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Building organization chart…</p>
        </div>
      </div>
    );
  }

  if (isError || !tree) {
    return (
      <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-md">
        Failed to load organizational hierarchy.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Organization Chart</h1>
          <p className="text-sm text-gray-500 mt-1">
            Click a card to view details · Scroll to zoom · Drag to pan
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats pills */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
              <Users className="w-3.5 h-3.5 text-primary-500" />
              {totalEmployees} employees
            </span>
            <span className="flex items-center gap-1.5 bg-white border border-gray-200 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
              <UserCircle className="w-3.5 h-3.5 text-violet-500" />
              {rootCount} top-level
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search employees…"
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 w-48 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-gray-500 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas + Detail Panel */}
      <div className="relative flex-1">
        <div
          ref={canvasRef}
          className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] [background-size:24px_24px] bg-gray-50 border border-gray-200 rounded-2xl shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
        >
          <div
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: 'top center',
              transition: isPanning.current ? 'none' : 'transform 0.05s ease',
            }}
            className="inline-flex justify-center min-w-max pt-10 px-10 pb-20"
          >
            {tree.length === 0 ? (
              <div className="text-gray-500 flex flex-col items-center mt-20 gap-4">
                <UserCircle className="w-16 h-16 text-gray-300" />
                <p>No organizational data found.</p>
              </div>
            ) : (
              <div className="flex gap-16">
                {tree.map(rootNode => (
                  <TreeNode
                    key={rootNode._id}
                    node={rootNode}
                    onSelect={setSelectedNode}
                    selectedId={selectedNode?._id ?? null}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mr-1">Legend</span>
            {[
              { label: 'Super Admin', color: 'bg-violet-500' },
              { label: 'HR Manager', color: 'bg-blue-500' },
              { label: 'Employee', color: 'bg-emerald-500' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-[10px] text-gray-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <EmployeeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
