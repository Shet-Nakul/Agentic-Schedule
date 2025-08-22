// Shared data models between frontend and backend
const StaffModel = {
  id: Number,
  name: String,
  email: String,
  role: String,
  created_at: Date
};

const ContractModel = {
  id: Number,
  staff_id: Number,
  start_date: Date,
  end_date: Date,
  hours_per_week: Number
};

const ShiftModel = {
  id: Number,
  staff_id: Number,
  date: Date,
  start_time: String,
  end_time: String,
  status: String
};

const RequestModel = {
  id: Number,
  staff_id: Number,
  request_type: String,
  start_date: Date,
  end_date: Date,
  status: String,
  created_at: Date
};

module.exports = {
  StaffModel,
  ContractModel,
  ShiftModel,
  RequestModel
};
