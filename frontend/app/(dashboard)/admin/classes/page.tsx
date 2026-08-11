"use client";

import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import type { ClassDto } from "@/types/api";
import { Plus, Edit3, Trash2, School, Loader2 } from "lucide-react";

export default function ClassesPage() {
  const { classes, isLoading, createClass, updateClass, deleteClass, isCreating, isUpdating } = useClasses();

  const [name, setName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDto | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await createClass({ name });
      setName("");
      setIsCreateOpen(false);
    } catch {}
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !name) return;
    try {
      await updateClass({ id: editingClass.id, dto: { name } });
      setEditingClass(null);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Management</h1>
          <p className="text-sm text-muted-foreground">Configure grade levels and student cohorts</p>
        </div>
        <button
          onClick={() => {
            setName("");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No classes configured yet. Click "Add Class" to create one.
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="p-5 border rounded-2xl bg-card shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground">Class ID: {cls.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingClass(cls);
                    setName(cls.name);
                  }}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete class ${cls.name}?`)) deleteClass(cls.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-card rounded-xl p-6 border shadow-xl space-y-4">
            <h2 className="text-xl font-bold">Add Class</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-1.5 text-sm rounded-md border">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium">
                  {isCreating ? "Creating..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-card rounded-xl p-6 border shadow-xl space-y-4">
            <h2 className="text-xl font-bold">Edit Class</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Class Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-md bg-background text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingClass(null)} className="px-4 py-1.5 text-sm rounded-md border">
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground font-medium">
                  {isUpdating ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
