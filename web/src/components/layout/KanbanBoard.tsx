/**
 * Trello 风格看板组件
 * 使用 @hello-pangea/dnd 实现拖拽
 */

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

type Task = {
  id: string;
  title: string;
  description?: string;
};

type Column = {
  id: string;
  title: string;
  tasks: Task[];
};

interface KanbanBoardProps {
  columns: Column[];
  onDragEnd: (result: DropResult) => void;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({ columns, onDragEnd, onTaskClick }: KanbanBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 rounded-xl"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            {/* 列头 */}
            <div className="px-3 py-2 flex items-center justify-between">
              <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                {column.title}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                {column.tasks.length}
              </span>
            </div>

            {/* 任务列表 */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="px-3 pb-3 min-h-[100px] space-y-2"
                  style={{
                    backgroundColor: snapshot.isDraggingOver
                      ? 'var(--color-primary-soft)'
                      : 'transparent',
                    borderRadius: 'var(--radius-md)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {column.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick?.(task)}
                          className="p-3 rounded-lg cursor-pointer"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            boxShadow: 'var(--shadow-card)',
                            borderRadius: 'var(--radius-card)',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div
                            className="font-medium text-sm"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {task.title}
                          </div>
                          {task.description && (
                            <div
                              className="text-xs mt-1 line-clamp-2"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {task.description}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}

        {/* 添加列按钮 */}
        <button
          className="flex-shrink-0 w-72 h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-sm"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          + 添加列
        </button>
      </div>
    </DragDropContext>
  );
}

// ============ 示例数据 ============

export const DEMO_COLUMNS: Column[] = [
  {
    id: 'todo',
    title: '待处理',
    tasks: [
      { id: 'task-1', title: '采集箱数据清洗', description: '处理采集箱中的重复商品' },
      { id: 'task-2', title: '标题优化', description: '优化商品标题的关键词' },
      { id: 'task-3', title: 'SKU 核对', description: '核对 SKU 六段编码' },
    ],
  },
  {
    id: 'in-progress',
    title: '进行中',
    tasks: [
      { id: 'task-4', title: '违禁词检测', description: '检测商品描述中的违禁词' },
      { id: 'task-5', title: '图片处理', description: '批量处理商品主图' },
    ],
  },
  {
    id: 'done',
    title: '已完成',
    tasks: [
      { id: 'task-6', title: '竞品分析', description: '分析竞品价格和销量' },
    ],
  },
];
