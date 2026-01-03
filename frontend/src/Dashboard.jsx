import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "IT Support",
    priority: "medium"
  });

  useEffect(() => {fetchRequests();}, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/api/requests", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load requests");
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/api/requests", formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFormData({
        title: "",
        description: "",
        category: "IT Support",
        priority: "medium"
      });
      setShowCreateForm(false);
      fetchRequests();
    } 
    catch (err) {
      setError("Failed to create request");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:3000/api/requests/${id}`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      fetchRequests();
    } catch (err) {
      setError("Failed to update request");
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/api/requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchRequests();
    } catch (err) {
      setError("Failed to delete request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Request Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.email}</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {user.role}
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {user.role === "admin" ? "All Requests" : "My Requests"}
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Request
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>IT Support</option>
                    <option>HR</option>
                    <option>Facilities</option>
                    <option>Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              No requests yet. Create your first request!
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{request.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    request.status === "approved" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {request.status}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{request.description}</p>

                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                    {request.category}
                  </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    request.priority === "high" ? "bg-red-50 text-red-700" :
                    request.priority === "medium" ? "bg-yellow-50 text-yellow-700" :
                    "bg-gray-50 text-gray-700"
                  }`}>
                    {request.priority}
                  </span>
                </div>

                {user.role === "admin" && request.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(request.id, "approved")}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request.id, "rejected")}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {user.id === request.user_id && (
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="w-full mt-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;