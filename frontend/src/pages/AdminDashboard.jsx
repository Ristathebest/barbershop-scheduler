import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [serviceError, setServiceError] = useState(null);

  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [staffError, setStaffError] = useState(null);

  const [newAvailStaffId, setNewAvailStaffId] = useState("");
  const [newAvailDay, setNewAvailDay] = useState("1");
  const [newAvailStart, setNewAvailStart] = useState("09:00");
  const [newAvailEnd, setNewAvailEnd] = useState("17:00");
  const [availError, setAvailError] = useState(null);

  // Editing state — which row (if any) is currently being edited, and its draft values.
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServicePrice, setEditServicePrice] = useState("");
  const [editServiceDuration, setEditServiceDuration] = useState("");

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffEmail, setEditStaffEmail] = useState("");
  const [editingAvailId, setEditingAvailId] = useState(null);
  const [editAvailDay, setEditAvailDay] = useState("1");
  const [editAvailStart, setEditAvailStart] = useState("09:00");
  const [editAvailEnd, setEditAvailEnd] = useState("17:00");

  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  function loadData() {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    Promise.all([
      fetch("http://localhost:4000/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (res.status === 401) throw new Error("unauthorized");
        return res.json();
      }),
      fetch("http://localhost:4000/api/services").then((res) => res.json()),
      fetch("http://localhost:4000/api/staff").then((res) => res.json()),
      fetch("http://localhost:4000/api/availability").then((res) => res.json()),
    ])
      .then(([bookingsData, servicesData, staffData, availabilityData]) => {
        setBookings(bookingsData);
        setServices(servicesData);
        setStaff(staffData);
        setAvailability(availabilityData);
        setLoading(false);
        if (staffData.length > 0 && !newAvailStaffId) {
          setNewAvailStaffId(String(staffData[0].id));
        }
      })
      .catch(() => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      });
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  }

  function handleAddService(e) {
    e.preventDefault();
    setServiceError(null);
    fetch("http://localhost:4000/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: newServiceName,
        price: newServicePrice,
        duration_minutes: newServiceDuration,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add service");
        return res.json();
      })
      .then(() => {
        setNewServiceName("");
        setNewServicePrice("");
        setNewServiceDuration("");
        loadData();
      })
      .catch(() => setServiceError("Failed to add service"));
  }

  function handleAddStaff(e) {
    e.preventDefault();
    setStaffError(null);
    fetch("http://localhost:4000/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newStaffName, email: newStaffEmail || null }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add staff member");
        return res.json();
      })
      .then(() => {
        setNewStaffName("");
        setNewStaffEmail("");
        loadData();
      })
      .catch(() => setStaffError("Failed to add staff member"));
  }

  function handleAddAvailability(e) {
    e.preventDefault();
    setAvailError(null);
    fetch("http://localhost:4000/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        staff_id: newAvailStaffId,
        day_of_week: newAvailDay,
        start_time: newAvailStart,
        end_time: newAvailEnd,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add availability");
        return res.json();
      })
      .then(() => loadData())
      .catch(() => setAvailError("Failed to add availability"));
  }
  function handleAddAvailabilityAllDays(e) {
  e.preventDefault();
  setAvailError(null);

  // Fire one request per day of the week (0 through 6), using whatever staff/start/end is currently selected.
  const requests = [0, 1, 2, 3, 4, 5, 6].map((day) =>
    fetch("http://localhost:4000/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        staff_id: newAvailStaffId,
        day_of_week: day,
        start_time: newAvailStart,
        end_time: newAvailEnd,
      }),
    })
  );

  Promise.all(requests)
    .then(() => loadData())
    .catch(() => setAvailError("Failed to add availability for all days"));
}

function handleDeleteAvailability(availId) {
  fetch(`http://localhost:4000/api/availability/${availId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to delete availability");
      return res.json();
    })
    .then(() => loadData())
    .catch(() => alert("Failed to delete availability"));
}

function handleStartEditAvail(entry) {
  setEditingAvailId(entry.id);
  setEditAvailDay(String(entry.day_of_week));
  setEditAvailStart(entry.start_time.slice(0, 5));
  setEditAvailEnd(entry.end_time.slice(0, 5));
}

function handleCancelEditAvail() {
  setEditingAvailId(null);
}

function handleSaveEditAvail(availId) {
  fetch(`http://localhost:4000/api/availability/${availId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      day_of_week: editAvailDay,
      start_time: editAvailStart,
      end_time: editAvailEnd,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to update availability");
      return res.json();
    })
    .then(() => {
      setEditingAvailId(null);
      loadData();
    })
    .catch(() => alert("Failed to update availability"));
}

// Groups the flat availability array into { staffId: [entries] }, so we can render one section per staff member.
function groupAvailabilityByStaff() {
  return availability.reduce((groups, entry) => {
    const key = entry.staff_id;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
    return groups;
  }, {});
}
  function handleDeleteService(serviceId) {
    fetch(`http://localhost:4000/api/services/${serviceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 409) {
          const confirmDeactivate = window.confirm(
            `${data.error}. Deactivate it instead so it no longer shows for new bookings?`
          );
          if (confirmDeactivate) {
            return fetch(`http://localhost:4000/api/services/${serviceId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ active: false }),
            }).then(() => loadData());
          }
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed to delete service");
        loadData();
      })
      .catch((err) => alert(err.message));
  }

  function handleDeleteStaff(staffId) {
    fetch(`http://localhost:4000/api/staff/${staffId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 409) {
          const confirmDeactivate = window.confirm(
            `${data.error}. Deactivate it instead so it no longer shows for new bookings?`
          );
          if (confirmDeactivate) {
            return fetch(`http://localhost:4000/api/staff/${staffId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ active: false }),
            }).then(() => loadData());
          }
          return;
        }
        if (!res.ok) throw new Error(data.error || "Failed to delete staff member");
        loadData();
      })
      .catch((err) => alert(err.message));
  }

  function handleReactivateService(serviceId) {
    fetch(`http://localhost:4000/api/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: true }),
    })
      .then(() => loadData())
      .catch(() => alert("Failed to reactivate service"));
  }

  function handleReactivateStaff(staffId) {
    fetch(`http://localhost:4000/api/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: true }),
    })
      .then(() => loadData())
      .catch(() => alert("Failed to reactivate staff member"));
  }

  function handleStartEditService(service) {
    setEditingServiceId(service.id);
    setEditServiceName(service.name);
    setEditServicePrice(service.price);
    setEditServiceDuration(service.duration_minutes);
  }

  function handleCancelEditService() {
    setEditingServiceId(null);
  }

  function handleSaveEditService(serviceId) {
    fetch(`http://localhost:4000/api/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editServiceName,
        price: editServicePrice,
        duration_minutes: editServiceDuration,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update service");
        return res.json();
      })
      .then(() => {
        setEditingServiceId(null);
        loadData();
      })
      .catch(() => alert("Failed to update service"));
  }

  function handleStartEditStaff(member) {
    setEditingStaffId(member.id);
    setEditStaffName(member.name);
    setEditStaffEmail(member.email || "");
  }

  function handleCancelEditStaff() {
    setEditingStaffId(null);
  }

  function handleSaveEditStaff(staffId) {
    fetch(`http://localhost:4000/api/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editStaffName, email: editStaffEmail || null }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update staff member");
        return res.json();
      })
      .then(() => {
        setEditingStaffId(null);
        loadData();
      })
      .catch(() => alert("Failed to update staff member"));
  }

  function handleCancelBooking(bookingId) {
    fetch(`http://localhost:4000/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "cancelled" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to cancel booking");
        return res.json();
      })
      .then(() => loadData())
      .catch(() => alert("Failed to cancel booking"));
  }

  function staffName(staffId) {
    const member = staff.find((s) => s.id === staffId);
    return member ? member.name : `Staff #${staffId}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const inputClasses =
    "border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500";
  const smallInputClasses =
    "border border-gray-300 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const cardClasses = "bg-white rounded-xl shadow-md p-6 mb-6";
  const sectionTitleClasses = "text-lg font-bold text-gray-900 mb-4";
  const actionButtonClasses =
    "text-xs font-medium border rounded-lg px-3 py-1 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
          >
            Log Out
          </button>
        </div>

        <div className={cardClasses}>
          <h2 className={sectionTitleClasses}>All Bookings</h2>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-sm">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wide">
                    <th className="py-2 pr-4">Client</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Start Time</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900">{b.client_name}</td>
                      <td className="py-3 pr-4 text-gray-600">{b.client_email}</td>
                      <td className="py-3 pr-4 text-gray-600">{new Date(b.start_time).toUTCString()}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            b.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className={`${actionButtonClasses} text-red-600 border-red-200 hover:text-red-800`}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={cardClasses}>
          <h2 className={sectionTitleClasses}>Manage Services</h2>
          <ul className="mb-5 divide-y divide-gray-100">
            {services.map((s) => (
              <li key={s.id} className="py-3 text-sm text-gray-700">
                {editingServiceId === s.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      className={smallInputClasses}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editServicePrice}
                      onChange={(e) => setEditServicePrice(e.target.value)}
                      className={smallInputClasses}
                    />
                    <input
                      type="number"
                      value={editServiceDuration}
                      onChange={(e) => setEditServiceDuration(e.target.value)}
                      className={smallInputClasses}
                    />
                    <button
                      onClick={() => handleSaveEditService(s.id)}
                      className={`${actionButtonClasses} bg-blue-600 text-white border-blue-600`}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditService}
                      className={`${actionButtonClasses} text-gray-600 border-gray-300`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-medium text-gray-900">{s.name}</span> — ${s.price} (
                      {s.duration_minutes} min)
                      {!s.active && <span className="ml-2 text-xs text-gray-400 italic">(inactive)</span>}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEditService(s)}
                        className={`${actionButtonClasses} text-blue-600 border-blue-200 hover:text-blue-800`}
                      >
                        Edit
                      </button>
                      {!s.active && (
                        <button
                          onClick={() => handleReactivateService(s.id)}
                          className={`${actionButtonClasses} text-green-600 border-green-200 hover:text-green-800`}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className={`${actionButtonClasses} text-red-600 border-red-200 hover:text-red-800`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add a service</h3>
          <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelClasses}>Name</label>
              <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Price</label>
              <input type="number" step="0.01" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Duration (min)</label>
              <input type="number" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} required className={inputClasses} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition">
                Add Service
              </button>
            </div>
          </form>
          {serviceError && <p className="text-red-600 text-sm mt-3">{serviceError}</p>}
        </div>

        <div className={cardClasses}>
          <h2 className={sectionTitleClasses}>Manage Staff</h2>
          <ul className="mb-5 divide-y divide-gray-100">
            {staff.map((s) => (
              <li key={s.id} className="py-3 text-sm text-gray-700">
                {editingStaffId === s.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editStaffName}
                      onChange={(e) => setEditStaffName(e.target.value)}
                      className={smallInputClasses}
                    />
                    <input
                      type="email"
                      value={editStaffEmail}
                      onChange={(e) => setEditStaffEmail(e.target.value)}
                      className={`${smallInputClasses} w-48`}
                    />
                    <button
                      onClick={() => handleSaveEditStaff(s.id)}
                      className={`${actionButtonClasses} bg-blue-600 text-white border-blue-600`}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditStaff}
                      className={`${actionButtonClasses} text-gray-600 border-gray-300`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-medium text-gray-900">{s.name}</span> {s.email ? `(${s.email})` : ""}
                      {!s.active && <span className="ml-2 text-xs text-gray-400 italic">(inactive)</span>}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEditStaff(s)}
                        className={`${actionButtonClasses} text-blue-600 border-blue-200 hover:text-blue-800`}
                      >
                        Edit
                      </button>
                      {!s.active && (
                        <button
                          onClick={() => handleReactivateStaff(s.id)}
                          className={`${actionButtonClasses} text-green-600 border-green-200 hover:text-green-800`}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className={`${actionButtonClasses} text-red-600 border-red-200 hover:text-red-800`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add a staff member</h3>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelClasses}>Name</label>
              <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Email (optional)</label>
              <input type="email" value={newStaffEmail} onChange={(e) => setNewStaffEmail(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <button type="submit" className="bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition">
                Add Staff Member
              </button>
            </div>
          </form>
          {staffError && <p className="text-red-600 text-sm mt-3">{staffError}</p>}
        </div>

        <div className={cardClasses}>
          <h2 className={sectionTitleClasses}>Manage Availability (Working Hours)</h2>
          <div className="mb-5">
  {Object.entries(groupAvailabilityByStaff()).map(([staffId, entries]) => (
    <div key={staffId} className="mb-4 last:mb-0">
      <p className="font-semibold text-gray-900 text-sm mb-2">{staffName(Number(staffId))}</p>
      <ul className="divide-y divide-gray-100 pl-2 border-l-2 border-gray-100">
        {entries
          .sort((a, b) => a.day_of_week - b.day_of_week)
          .map((a) => (
            <li key={a.id} className="py-2 pl-2 text-sm text-gray-700">
              {editingAvailId === a.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={editAvailDay}
                    onChange={(e) => setEditAvailDay(e.target.value)}
                    className={smallInputClasses}
                  >
                    {DAY_NAMES.map((name, index) => (
                      <option key={index} value={index}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={editAvailStart}
                    onChange={(e) => setEditAvailStart(e.target.value)}
                    className={smallInputClasses}
                  />
                  <input
                    type="time"
                    value={editAvailEnd}
                    onChange={(e) => setEditAvailEnd(e.target.value)}
                    className={smallInputClasses}
                  />
                  <button
                    onClick={() => handleSaveEditAvail(a.id)}
                    className={`${actionButtonClasses} bg-blue-600 text-white border-blue-600`}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditAvail}
                    className={`${actionButtonClasses} text-gray-600 border-gray-300`}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>
                    {DAY_NAMES[a.day_of_week]}: {a.start_time.slice(0, 5)} to {a.end_time.slice(0, 5)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEditAvail(a)}
                      className={`${actionButtonClasses} text-blue-600 border-blue-200 hover:text-blue-800`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAvailability(a.id)}
                      className={`${actionButtonClasses} text-red-600 border-red-200 hover:text-red-800`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
      </ul>
    </div>
  ))}
</div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Add working hours</h3>
          <form onSubmit={handleAddAvailability} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className={labelClasses}>Staff member</label>
              <select value={newAvailStaffId} onChange={(e) => setNewAvailStaffId(e.target.value)} className={inputClasses}>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Day</label>
              <select value={newAvailDay} onChange={(e) => setNewAvailDay(e.target.value)} className={inputClasses}>
                {DAY_NAMES.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Start time</label>
              <input type="time" value={newAvailStart} onChange={(e) => setNewAvailStart(e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>End time</label>
              <input type="time" value={newAvailEnd} onChange={(e) => setNewAvailEnd(e.target.value)} className={inputClasses} />
            </div>
            <div className="sm:col-span-4 flex gap-3">
              <button type="submit" className="bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition">
                Add Working Hours
              </button>
              <button
                type="button"
                onClick={handleAddAvailabilityAllDays}
                className="bg-gray-100 text-gray-700 font-semibold rounded-lg px-4 py-2 hover:bg-gray-200 transition border border-gray-300"
              >
                Apply to All 7 Days
              </button>
            </div>
          </form>
          {availError && <p className="text-red-600 text-sm mt-3">{availError}</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;