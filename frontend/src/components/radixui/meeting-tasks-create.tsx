import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";

export default function MeetingConfirmPage() {
  const { meeting_id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/v1/tasks/meeting/${meeting_id}`)
      .then((res) => setTasks(res.data))
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoading(false));
  }, [meeting_id]);

  const handleEdit = (task) => {
    setEditTaskId(task.task_id);
    setEditTaskData({ ...task });
  };

  const handleEditChange = (e) => {
    setEditTaskData({ ...editTaskData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/api/v1/tasks/${editTaskId}`, editTaskData);
      setTasks((prev) =>
        prev.map((t) => (t.task_id === editTaskId ? { ...t, ...editTaskData } : t))
      );
      setEditTaskId(null);
    } catch {
      setError("Failed to update task.");
    }
  };

  const handleDelete = async (task_id) => {
    try {
      await api.delete(`/api/v1/tasks/${task_id}`);
      setTasks((prev) => prev.filter((t) => t.task_id !== task_id));
    } catch {
      setError("Failed to delete task.");
    }
  };

  const handleConfirm = async (task_id) => {
    try {
      await api.post(`/api/v1/tasks/`, tasks.find((t) => t.task_id === task_id));
      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === task_id ? { ...t, confirmed: true } : t
        )
      );
    } catch {
      setError("Failed to confirm task.");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-8 text-muted-foreground">Loading...</div>
    );
  if (error)
    return (
      <div className="text-center mt-8 text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Confirm Tasks for Meeting #{meeting_id}
      </h1>
      <div className="flex flex-col gap-6">
        {tasks.map((task) => (
          <div
            className="border rounded-lg p-4 bg-white shadow-sm"
            key={task.task_id}
          >
            {editTaskId === task.task_id ? (
              <div>
                <input
                  name="title"
                  value={editTaskData.title}
                  onChange={handleEditChange}
                  className="w-full mb-2 p-2 border rounded"
                />
                <textarea
                  name="description"
                  value={editTaskData.description}
                  onChange={handleEditChange}
                  className="w-full mb-2 p-2 border rounded"
                />
                {/* Add more fields as needed */}
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 rounded bg-blue-600 text-white"
                    onClick={handleEditSave}
                  >
                    Save
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-gray-400 text-white"
                    onClick={() => setEditTaskId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="mb-2 text-gray-700">{task.description}</p>
                {/* Add more fields as needed */}
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1 rounded bg-yellow-500 text-white"
                    onClick={() => handleEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-4 py-1 rounded bg-red-600 text-white"
                    onClick={() => handleDelete(task.task_id)}
                  >
                    Delete
                  </button>
                  <button
                    className={`px-4 py-1 rounded ${
                      task.confirmed
                        ? "bg-green-400 text-white"
                        : "bg-green-600 text-white"
                    }`}
                    onClick={() => handleConfirm(task.task_id)}
                    disabled={task.confirmed}
                  >
                    {task.confirmed ? "Confirmed" : "Confirm"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

