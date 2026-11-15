// import { useEffect, useMemo, useState } from "react";
// import API from "../../services/api";
// import {
//   CalendarDays,
//   Clock,
//   BookOpen,
//   CheckCircle2,
//   AlertCircle,
//   RefreshCw,
//   Hourglass,
//   CalendarCheck,
// } from "lucide-react";

// const getDateTime = (date, time) => {
//   if (!date || !time) return null;

//   const parsedDate = new Date(date);

//    console.log("page 7");

//   if (Number.isNaN(parsedDate.getTime())) return null;

//   // Extract the date in the user's local timezone
//   const year = parsedDate.getFullYear();
//   const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
//   const day = String(parsedDate.getDate()).padStart(2, "0");

//   const timePart = String(time).slice(0, 8);

//   const result = new Date(`${year}-${month}-${day}T${timePart}`);

//   return Number.isNaN(result.getTime()) ? null : result;
// };

// const getExamStatus = (exam) => {
//   const start = getDateTime(exam.exam_date, exam.start_time);
//   const end = getDateTime(exam.exam_date, exam.end_time);
//   const now = new Date();

//   if (!start || !end) return "unknown";
//   if (now < start) return "upcoming";
//   if (now <= end) return "live";
//   return "completed";
// };

// const formatDate = (date) => {
//   if (!date) return "Date unavailable";

//   const parsed = new Date(date);

//   if (Number.isNaN(parsed.getTime())) {
//     return "Date unavailable";
//   }

//   return parsed.toLocaleDateString("en-IN", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// const formatTime = (time) => {
//   if (!time) return "--:--";

//   const [hours, minutes] = String(time).slice(0, 5).split(":");
//   const date = new Date();
//   date.setHours(Number(hours), Number(minutes), 0, 0);

//   return date.toLocaleTimeString("en-IN", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// export default function StudentSchedulePage() {
//   const [schedules, setSchedules] = useState([]);
//   const [activeTab, setActiveTab] = useState("all");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchSchedule = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await API.get("/student/schedule");
//       setSchedules(response.data.schedules || []);
//     } catch (err) {
//       setError(
//         err.response?.data?.message || "Unable to load your exam schedule."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchSchedule();
//   }, []);

//   const categorizedSchedules = useMemo(() => {
//     return schedules.map((exam) => ({
//       ...exam,
//       status: getExamStatus(exam),
//     }));
//   }, [schedules]);

//   const upcomingCount = categorizedSchedules.filter(
//     (exam) => exam.status === "upcoming"
//   ).length;

//   const liveCount = categorizedSchedules.filter(
//     (exam) => exam.status === "live"
//   ).length;

//   const completedCount = categorizedSchedules.filter(
//     (exam) => exam.status === "completed"
//   ).length;

//   const filteredSchedules = categorizedSchedules.filter((exam) => {
//     if (activeTab === "upcoming") {
//       return exam.status === "upcoming" || exam.status === "live";
//     }

//     if (activeTab === "completed") {
//       return exam.status === "completed";
//     }

//     return true;
//   });

//   if (loading) {
//     return (
//       <div className="schedule-loading">
//         <RefreshCw className="schedule-spinner" size={28} />
//         <p>Loading your examination schedule...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="schedule-error">
//         <AlertCircle size={32} />
//         <h3>Something went wrong</h3>
//         <p>{error}</p>
//         <button onClick={fetchSchedule}>
//           <RefreshCw size={16} /> Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="schedule-page">
//       <div className="schedule-header">
//         <div>
//           <span className="schedule-eyebrow">STUDENT PORTAL</span>
//           <h1>My Exam Schedule</h1>
//           <p>Keep track of your upcoming and previous examinations.</p>
//         </div>

//         <button
//           className="schedule-refresh"
//           onClick={fetchSchedule}
//           title="Refresh schedule"
//         >
//           <RefreshCw size={17} />
//           Refresh
//         </button>
//       </div>

//       <div className="schedule-stats">
//         <div className="schedule-stat-card">
//           <div className="stat-icon total-icon">
//             <BookOpen size={21} />
//           </div>
//           <div>
//             <span>Total Exams</span>
//             <h2>{schedules.length}</h2>
//           </div>
//         </div>

//         <div className="schedule-stat-card">
//           <div className="stat-icon upcoming-icon">
//             <CalendarCheck size={21} />
//           </div>
//           <div>
//             <span>Upcoming</span>
//             <h2>{upcomingCount}</h2>
//           </div>
//         </div>

//         <div className="schedule-stat-card">
//           <div className="stat-icon live-icon">
//             <Hourglass size={21} />
//           </div>
//           <div>
//             <span>Live Now</span>
//             <h2>{liveCount}</h2>
//           </div>
//         </div>

//         <div className="schedule-stat-card">
//           <div className="stat-icon completed-icon">
//             <CheckCircle2 size={21} />
//           </div>
//           <div>
//             <span>Completed</span>
//             <h2>{completedCount}</h2>
//           </div>
//         </div>
//       </div>

//       <div className="schedule-list-header">
//         <div>
//           <h2>Examinations</h2>
//           <p>View all your scheduled examinations.</p>
//         </div>

//         <div className="schedule-tabs">
//           {["all", "upcoming", "completed"].map((tab) => (
//             <button
//               key={tab}
//               className={activeTab === tab ? "active" : ""}
//               onClick={() => setActiveTab(tab)}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>
//       </div>

//       {filteredSchedules.length === 0 ? (
//         <div className="schedule-empty">
//           <div className="empty-icon">
//             <CalendarDays size={34} />
//           </div>
//           <h3>
//             {schedules.length === 0
//               ? "No examinations scheduled"
//               : "No examinations found"}
//           </h3>
//           <p>
//             {schedules.length === 0
//               ? "Your examinations will appear here once they are scheduled."
//               : "There are no exams in this category right now."}
//           </p>
//         </div>
//       ) : (
//         <div className="schedule-grid">
//           {filteredSchedules.map((exam) => (
//             <article className="exam-card" key={exam.schedule_id}>
//               <div className="exam-card-top">
//                 <div className="exam-subject-icon">
//                   <BookOpen size={21} />
//                 </div>

//                 <span className={`exam-status ${exam.status}`}>
//                   {exam.status === "live"
//                     ? "Live Now"
//                     : exam.status === "completed"
//                     ? "Completed"
//                     : exam.status === "upcoming"
//                     ? "Upcoming"
//                     : "Unknown"}
//                 </span>
//               </div>

//               <div className="exam-card-content">
//                 <span className="exam-label">EXAMINATION</span>
//                 <h3>{exam.exam_name || "Untitled Exam"}</h3>
//                 <p className="exam-subject">
//                   {exam.subject_name || "Subject not specified"}
//                 </p>
//               </div>

//               <div className="exam-details">
//                 <div className="exam-detail">
//                   <CalendarDays size={17} />
//                   <div>
//                     <span>Date</span>
//                     <strong>{formatDate(exam.exam_date)}</strong>
//                   </div>
//                 </div>

//                 <div className="exam-detail">
//                   <Clock size={17} />
//                   <div>
//                     <span>Time</span>
//                     <strong>
//                       {formatTime(exam.start_time)} –{" "}
//                       {formatTime(exam.end_time)}
//                     </strong>
//                   </div>
//                 </div>
//               </div>

//               <div className="exam-card-footer">
//                 <span>
//                   <Clock size={15} />
//                   {exam.duration ? `${exam.duration} minutes` : "Duration N/A"}
//                 </span>

//                 <span>
//                   <BookOpen size={15} />
//                   {exam.total_marks ?? "--"} Marks
//                 </span>
//               </div>
//             </article>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import {
  CalendarDays,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Hourglass,
  CalendarCheck,
  XCircle,
} from "lucide-react";

// Returns 'YYYY-MM-DD' from a plain date string or a full timestamp.
const parseDatePart = (date) => {
  if (!date) return null;

  const s = String(date).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Fallback for full timestamps
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const getDateTime = (date, time) => {
  const datePart = parseDatePart(date);
  if (!datePart || !time) return null;

  const result = new Date(`${datePart}T${String(time).slice(0, 8)}`);
  return Number.isNaN(result.getTime()) ? null : result;
};

const getExamStatus = (exam) => {
  const start = getDateTime(exam.exam_date, exam.start_time);
  const end = getDateTime(exam.exam_date, exam.end_time);
  const now = new Date();

  if (!start || !end) return "unknown";

  // The student submitted the exam
  if (
    exam.attempt_status === "SUBMITTED" ||
    exam.attempt_status === "COMPLETED"
  ) {
    return "completed";
  }

  if (now < start) return "upcoming";
  if (now <= end) return "live";

  // Window ended and the student never submitted
  return "missed";
};

const formatDate = (date) => {
  const datePart = parseDatePart(date);
  if (!datePart) return "Date unavailable";

  return new Date(`${datePart}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "--:--";

  const [hours, minutes] = String(time).slice(0, 5).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const STATUS_LABELS = {
  live: "Live Now",
  upcoming: "Upcoming",
  completed: "Completed",
  missed: "Missed",
  unknown: "Unknown",
};

export default function StudentSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/student/schedule");
      setSchedules(response.data.schedules || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your exam schedule."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const categorizedSchedules = useMemo(() => {
    return schedules.map((exam) => ({
      ...exam,
      status: getExamStatus(exam),
    }));
  }, [schedules]);

  const countByStatus = (status) =>
    categorizedSchedules.filter((exam) => exam.status === status).length;

  const upcomingCount = countByStatus("upcoming");
  const liveCount = countByStatus("live");
  const completedCount = countByStatus("completed");
  const missedCount = countByStatus("missed");

  const filteredSchedules = categorizedSchedules.filter((exam) => {
    if (activeTab === "upcoming") {
      return exam.status === "upcoming" || exam.status === "live";
    }

    if (activeTab === "completed") {
      return exam.status === "completed" || exam.status === "missed";
    }

    return true;
  });

  if (loading) {
    return (
      <div className="schedule-loading">
        <RefreshCw className="schedule-spinner" size={28} />
        <p>Loading your examination schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-error">
        <AlertCircle size={32} />
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={fetchSchedule}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div>
          <span className="schedule-eyebrow">STUDENT PORTAL</span>
          <h1>My Exam Schedule</h1>
          <p>Keep track of your upcoming and previous examinations.</p>
        </div>

        <button
          className="schedule-refresh"
          onClick={fetchSchedule}
          title="Refresh schedule"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="schedule-stats">
        <div className="schedule-stat-card">
          <div className="stat-icon total-icon">
            <BookOpen size={21} />
          </div>
          <div>
            <span>Total Exams</span>
            <h2>{schedules.length}</h2>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="stat-icon upcoming-icon">
            <CalendarCheck size={21} />
          </div>
          <div>
            <span>Upcoming</span>
            <h2>{upcomingCount}</h2>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="stat-icon live-icon">
            <Hourglass size={21} />
          </div>
          <div>
            <span>Live Now</span>
            <h2>{liveCount}</h2>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="stat-icon completed-icon">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Completed</span>
            <h2>{completedCount}</h2>
          </div>
        </div>

        <div className="schedule-stat-card">
          <div className="stat-icon missed-icon">
            <XCircle size={21} />
          </div>
          <div>
            <span>Missed</span>
            <h2>{missedCount}</h2>
          </div>
        </div>
      </div>

      <div className="schedule-list-header">
        <div>
          <h2>Examinations</h2>
          <p>View all your scheduled examinations.</p>
        </div>

        <div className="schedule-tabs">
          {["all", "upcoming", "completed"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="schedule-empty">
          <div className="empty-icon">
            <CalendarDays size={34} />
          </div>
          <h3>
            {schedules.length === 0
              ? "No examinations scheduled"
              : "No examinations found"}
          </h3>
          <p>
            {schedules.length === 0
              ? "Your examinations will appear here once they are scheduled."
              : "There are no exams in this category right now."}
          </p>
        </div>
      ) : (
        <div className="schedule-grid">
          {filteredSchedules.map((exam) => (
            <article className="exam-card" key={exam.schedule_id}>
              <div className="exam-card-top">
                <div className="exam-subject-icon">
                  <BookOpen size={21} />
                </div>

                <span className={`exam-status ${exam.status}`}>
                  {STATUS_LABELS[exam.status] || "Unknown"}
                </span>
              </div>

              <div className="exam-card-content">
                <span className="exam-label">EXAMINATION</span>
                <h3>{exam.exam_name || "Untitled Exam"}</h3>
                <p className="exam-subject">
                  {exam.subject_name || "Subject not specified"}
                </p>
              </div>

              <div className="exam-details">
                <div className="exam-detail">
                  <CalendarDays size={17} />
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(exam.exam_date)}</strong>
                  </div>
                </div>

                <div className="exam-detail">
                  <Clock size={17} />
                  <div>
                    <span>Time</span>
                    <strong>
                      {formatTime(exam.start_time)} –{" "}
                      {formatTime(exam.end_time)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="exam-card-footer">
                <span>
                  <Clock size={15} />
                  {exam.duration ? `${exam.duration} minutes` : "Duration N/A"}
                </span>

                <span>
                  <BookOpen size={15} />
                  {exam.total_marks ?? "--"} Marks
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}