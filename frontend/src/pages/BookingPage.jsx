import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL = import.meta.env.VITE_API_URL;

function BookingPage() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [booking, setBooking] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/services`).then((res) => res.json()),
      fetch(`${API_URL}/api/staff`).then((res) => res.json()),
    ]).then(([servicesData, staffData]) => {
      setServices(servicesData.filter((s) => s.active));
      setStaff(staffData.filter((s) => s.active));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedService || !selectedStaff || !selectedDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    fetch(
      `${API_URL}/api/slots?staff_id=${selectedStaff.id}&service_id=${selectedService.id}&date=${selectedDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots);
        setSlotsLoading(false);
      });
  }, [selectedService, selectedStaff, selectedDate]);

  function handleSubmitBooking(e) {
    e.preventDefault();
    setSubmitError(null);

    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);

    fetch(`${API_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail,
        service_id: selectedService.id,
        staff_id: selectedStaff.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Booking failed");
        return res.json();
      })
      .then((data) => setBooking(data))
      .catch(() => setSubmitError("Something went wrong booking this slot. It may have just been taken."));
  }

  function handleBackToStart() {
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setClientName("");
    setClientEmail("");
    setBooking(null);
    setSubmitError(null);
  }

  function Divider() {
    return (
      <div className="flex items-center gap-3 my-4">
        <div className="h-px flex-1 bg-amber-500/40" />
        <div className="w-1.5 h-1.5 rotate-45 bg-amber-500" />
        <div className="h-px flex-1 bg-amber-500/40" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (booking) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500 text-amber-500 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <h1 className="font-heading text-2xl font-bold text-amber-500 mb-2">Booking Confirmed</h1>
          <p className="text-neutral-300">
            {clientName}, your <span className="text-white font-semibold">{selectedService.name}</span> with{" "}
            <span className="text-white font-semibold">{selectedStaff.name}</span> is booked for:
          </p>
          <p className="mt-3 font-semibold text-amber-400">{new Date(booking.start_time).toUTCString()}</p>
          <p className="mt-4 text-sm text-neutral-500">A confirmation email is on its way to {clientEmail}.</p>
          <button
            onClick={handleBackToStart}
            className="mt-6 w-full bg-amber-500 text-neutral-900 font-bold rounded-lg py-2.5 hover:bg-amber-400 transition"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="text-center pt-12 pb-6 px-4 border-b border-neutral-800">
        <p className="text-amber-500 text-xs tracking-[0.3em] uppercase mb-2">Est. 2026</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white">Marko's Barber Co.</h1>
        <p className="text-neutral-400 mt-3 text-sm tracking-wide">Traditional cuts, straight razor shaves, no rush.</p>
      </header>

      <div className="py-10 px-4 flex justify-center">
        <div className="max-w-2xl w-full bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl p-8">
          <h2 className="font-heading text-xl font-bold text-white mb-1">Book Your Appointment</h2>
          <Divider />

          <h3 className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3 mt-6">1. Choose a service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`text-left border rounded-lg p-4 transition ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-neutral-700 bg-neutral-900/40 hover:border-neutral-500"
                  }`}
                >
                  <p className={`font-semibold ${isSelected ? "text-amber-400" : "text-white"}`}>{service.name}</p>
                  <p className="text-sm text-neutral-400">
                    ${service.price} · {service.duration_minutes} min
                  </p>
                </button>
              );
            })}
          </div>

          <h3 className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">2. Choose a barber</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {staff.map((member) => {
              const isSelected = selectedStaff?.id === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaff(member)}
                  className={`border rounded-lg p-4 font-medium transition ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-neutral-700 bg-neutral-900/40 text-neutral-200 hover:border-neutral-500"
                  }`}
                >
                  {member.name}
                </button>
              );
            })}
          </div>

          {selectedService && selectedStaff && (
            <div className="mb-6">
              <h3 className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">3. Choose a date</h3>
              <DatePicker
                selected={selectedDate ? new Date(selectedDate + "T00:00:00") : null}
                onChange={(date) => {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  setSelectedDate(`${year}-${month}-${day}`);
                }}
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select a date"
                onKeyDown={(e) => e.preventDefault()}
                className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">4. Choose a time</h3>
              {slotsLoading ? (
                <p className="text-neutral-500 text-sm">Loading available times...</p>
              ) : slots.length === 0 ? (
                <p className="text-neutral-500 text-sm">No available times for this date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg py-2 text-sm font-medium border transition ${
                          isSelected
                            ? "bg-amber-500 text-neutral-900 border-amber-500"
                            : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                        }`}
                      >
                        {new Date(slot).toUTCString().slice(17, 22)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div>
              <h3 className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em] mb-3">5. Your details</h3>
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    required
                    className="bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-neutral-900 font-bold rounded-lg py-2.5 hover:bg-amber-400 transition"
                >
                  Confirm Booking
                </button>
              </form>
              {submitError && <p className="text-red-400 text-sm mt-3">{submitError}</p>}
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-6 text-neutral-600 text-xs">
        © 2026 Marko's Barber Co. · Made by Marko
      </footer>
    </div>
  );
}

export default BookingPage;