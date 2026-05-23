'use client';
import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ITask, IStatus } from '@/types/task.types';
import { useTaskStore } from '@/store/taskStore';
import { useParams } from 'next/navigation';
import { socketService } from '@/lib/services/socket.service';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function KanbanBoard({ channelId, isPrivileged }: { channelId: string; isPrivileged?: boolean }) {
  const { tasks, statuses, fetchTasks, fetchStatuses, moveTask, addTask, updateTaskLocally, deleteTaskPureLocal, createStatus, deleteStatusLocally, addStatusLocally, updateStatusLocally } = useTaskStore();
  const [activeTask, setActiveTask] = useState<ITask | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#4f46e5');
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  useEffect(() => {
    if (workspaceId) {
      fetchStatuses(workspaceId);
    }
    fetchTasks(channelId);

    // NOTE: socketService.connect() is handled by page.tsx with correct timing.
    // The socket registry automatically re-registers these listeners after reconnect.

    const handleTaskCreated = (data: { task: ITask }) => {
      const taskChannelId = typeof data.task.channelId === 'string' 
        ? data.task.channelId 
        : (data.task.channelId as any)?._id;
        
      if (taskChannelId === channelId) {
        addTask(data.task);
      }
    };

    const handleTaskUpdated = (data: { task: ITask }) => {
      const taskChannelId = typeof data.task.channelId === 'string' 
        ? data.task.channelId 
        : (data.task.channelId as any)?._id;
        
      if (taskChannelId === channelId) {
        updateTaskLocally(data.task._id, data.task);
      }
    };

    const handleTaskDeleted = (data: { taskId: string, channelId: string }) => {
      if (data.channelId === channelId) {
        deleteTaskPureLocal(data.taskId);
      }
    };

    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);
    socketService.onTaskDeleted(handleTaskDeleted);

    const handleStatusCreated = (data: { status: IStatus }) => {
      const incomingWorkspaceId = typeof data.status.workspaceId === 'string' 
        ? data.status.workspaceId 
        : (data.status.workspaceId as any)?._id || String(data.status.workspaceId);
      
      if (incomingWorkspaceId === workspaceId) {
        addStatusLocally(data.status);
      }
    };

    const handleStatusUpdated = (data: { status: IStatus }) => {
      const incomingWorkspaceId = typeof data.status.workspaceId === 'string' 
        ? data.status.workspaceId 
        : (data.status.workspaceId as any)?._id || String(data.status.workspaceId);
        
      if (incomingWorkspaceId === workspaceId) {
        updateStatusLocally(data.status._id, data.status);
      }
    };

    const handleStatusDeleted = (data: { statusId: string, workspaceId: string }) => {
      const incomingWorkspaceId = typeof data.workspaceId === 'string' 
        ? data.workspaceId 
        : (data.workspaceId as any)?._id || String(data.workspaceId);

      if (incomingWorkspaceId === workspaceId) {
        deleteStatusLocally(data.statusId);
      }
    };

    socketService.onStatusCreated(handleStatusCreated);
    socketService.onStatusUpdated(handleStatusUpdated);
    socketService.onStatusDeleted(handleStatusDeleted);

    return () => {
      socketService.offTaskCreated(handleTaskCreated);
      socketService.offTaskUpdated(handleTaskUpdated);
      socketService.offTaskDeleted(handleTaskDeleted);
      socketService.offStatusCreated(handleStatusCreated);
      socketService.offStatusUpdated(handleStatusUpdated);
      socketService.offStatusDeleted(handleStatusDeleted);
    };
  }, [channelId, workspaceId, addTask, updateTaskLocally, deleteTaskPureLocal, fetchTasks, fetchStatuses, addStatusLocally, updateStatusLocally, deleteStatusLocally]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Is it dropping over a column?
    const isOverColumn = statuses.some(s => s._id === overId);
    if (isOverColumn) {
      moveTask(activeId, overId);
      return;
    }

    // Dropping over another task, get its column
    const overTask = tasks.find(t => t._id === overId);
    if (overTask && overTask.statusId) {
      moveTask(activeId, typeof overTask.statusId === 'string' ? overTask.statusId : overTask.statusId._id);
    }
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    try {
      await createStatus({
        name: newColumnName.trim(),
        workspaceId,
        isCompleted: newColumnName.toLowerCase().includes('done') || newColumnName.toLowerCase().includes('completed'),
        order: statuses.length,
        color: newColumnColor
      });
      toast.success(`Column "${newColumnName}" added successfully!`);
      setNewColumnName('');
      setNewColumnColor('#4f46e5');
      setIsAddingColumn(false);
    } catch (err: any) {
      console.error("Failed to add column", err);
      toast.error(err?.response?.data?.message || "Failed to add column. You might not have permission.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0f1f] p-6 rounded-tl-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage project workflow</p>
        </div>
        <button
          onClick={() => {
            if (statuses.length === 0) {
              alert("Please add a column first before creating a task!");
              return;
            }
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={onDragStart} 
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 h-[calc(100vh-160px)] overflow-x-auto pb-4 custom-scrollbar">
          {statuses
            .slice()
            .sort((a, b) => {
              // Priority 1: isCompleted (false before true)
              if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
              }
              // Priority 2: original order
              return a.order - b.order;
            })
            .map((status) => (
              <KanbanColumn
                key={status._id}
                status={status}
                tasks={tasks.filter((t) => {
                  const sId = typeof t.statusId === 'string' ? t.statusId : t.statusId?._id;
                  return sId === status._id;
                })}
                isPrivileged={isPrivileged}
                onEditTask={(task) => {
                  setTaskToEdit(task);
                  setIsModalOpen(true);
                }}
              />
            ))}

          {/* Add Column Button / Form */}
          <div className="flex flex-col min-w-[300px] max-w-[320px] h-fit bg-[#13172e]/50 border border-white/5 border-dashed rounded-xl p-4 transition-all">
              {isAddingColumn ? (
                <form onSubmit={handleAddColumn} className="flex flex-col gap-3">
                  <input
                    type="text"
                    autoFocus
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Column name..."
                    className="w-full bg-[#1c2242] border border-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-end px-1">
                    <input 
                      type="color" 
                      value={newColumnColor}
                      onChange={(e) => setNewColumnColor(e.target.value)}
                      className="w-6 h-6 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                      title="Column Color"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newColumnName.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-300 text-sm py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="flex items-center justify-center gap-2 text-neutral-400 hover:text-white py-2 font-medium transition-colors w-full"
                >
                  <Plus size={18} />
                  Add Column
                </button>
              )}
            </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105 opacity-90 cursor-grabbing shadow-2xl">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={taskToEdit} 
        channelId={channelId}
      />
    </div>
  );
}
