const ItemRequest = require("../models/ItemRequest");

// Define available hours (9 AM to 5 PM)
const hours = [9, 10, 11, 12, 13, 14, 15, 16];

// Get available time slots for a specific date
exports.getAvailableTimeSlots = async (date) => {
  try {
    // Create a date object at midnight of the requested date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    // End date is at 23:59:59
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Find all appointments for this date
    const existingAppointments = await ItemRequest.find({
      appointmentTimeSlot: { $regex: new RegExp(`^${date}`) },
      status: "pending" // Only consider pending appointments
    });
    
    // Get booked time slots
    const bookedSlots = existingAppointments.map(app => app.appointmentTimeSlot);
    
    // Generate all possible time slots
    const allSlots = [];
    for (const hour of hours) {
      const timeString = `${hour}:00`;
      const slot = `${date}T${timeString.padStart(5, '0')}`;
      
      allSlots.push({
        time: timeString,
        slot: slot,
        available: !bookedSlots.includes(slot)
      });
      
      // Add half-hour slot
      const halfHourString = `${hour}:30`;
      const halfHourSlot = `${date}T${halfHourString.padStart(5, '0')}`;
      
      allSlots.push({
        time: halfHourString,
        slot: halfHourSlot,
        available: !bookedSlots.includes(halfHourSlot)
      });
    }
    
    return allSlots;
  } catch (error) {
    console.error("Error generating time slots:", error);
    throw error;
  }
};
