
// import React, {
//   useEffect,
//   useState,
//   useRef,
//   useCallback
// } from 'react';

// import { useParams, useNavigate } from 'react-router-dom';

// import {
//   Clock,
//   ShieldCheck,
//   ChevronLeft,
//   ChevronRight,
//   AlertTriangle,
//   Send,
//   X
// } from 'lucide-react';

// import { useAuth } from '../../contexts/AuthContext';
// import { studentService } from '../../services/studentService';

// console.log("page 2");


// export default function ExamInterfacePage() {
//   const { scheduleId } = useParams();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [examInfo, setExamInfo] = useState(null);
//   const [questions, setQuestions] = useState([]);
//   const [studentExam, setStudentExam] = useState(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const [currentQIndex, setCurrentQIndex] = useState(0);
//   const [answers, setAnswers] = useState({});

//   const [timeLeft, setTimeLeft] = useState(0);
//   const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   const timerRef = useRef(null);
//   const submittingRef = useRef(false);
//   const answersRef = useRef({});

//   // Keep latest answers available to timer callbacks.
//   useEffect(() => {
//     answersRef.current = answers;
//   }, [answers]);

//   // Convert exam date and time into a JavaScript Date.
//   const getExamDateTime = (date, time) => {
//     if (!date || !time) return null;

//     const d = new Date(date);

//     if (Number.isNaN(d.getTime())) return null;

//     const datePart = [
//       d.getFullYear(),
//       String(d.getMonth() + 1).padStart(2, '0'),
//       String(d.getDate()).padStart(2, '0')
//     ].join('-');

//     const result = new Date(
//       `${datePart}T${String(time).slice(0, 8)}`
//     );

//     return Number.isNaN(result.getTime()) ? null : result;
//   };

//   // Initialize examination.
//   useEffect(() => {
//     let active = true;

//     const init = async () => {
//       try {
//         if (!user?.user_id) {
//           setLoading(false);
//           return;
//         }

//         setLoading(true);
//         setError('');

//         // 1. Fetch available schedules.
//         const exams = await studentService.getAvailableExams();

//         console.log('Route schedule ID:', scheduleId);

//         console.log(
//           'Available schedule IDs:',
//           exams.map(e => e.schedule_id)
//         );

//         // 2. Find schedule using schedule_id.
//         const schedule = exams.find(
//           e => Number(e.schedule_id) === Number(scheduleId)
//         );

//         console.log('Matched schedule:', schedule);

//         if (!schedule) {
//           throw new Error(
//             "Examination not found or you don't have access."
//           );
//         }

//         if (!schedule.exam?.exam_id) {
//           throw new Error('Exam information is missing.');
//         }

//         // 3. Start or resume examination.
//         // Backend identifies student using authentication token.
//         const session = await studentService.startExam(
//           schedule.schedule_id
//         );

//         console.log('Student exam session:', session);

//         // 4. Fetch questions using exam_id.
//         const qs = await studentService.getExamQuestions(
//           schedule.exam.exam_id
//         );

//         console.log('Exam questions:', qs);

//         if (!Array.isArray(qs) || qs.length === 0) {
//           throw new Error(
//             'No questions are available for this examination.'
//           );
//         }

//         if (!active) return;

//         setExamInfo(schedule);
//         setStudentExam(session);
//         setQuestions(qs);

//         // 5. Restore previously saved answers if available.
//         const restoredAnswers = {};

//         if (Array.isArray(session.answers)) {
//           session.answers.forEach(answer => {
//             restoredAnswers[answer.question_id] = {
//               selected_option_id:
//                 answer.selected_option_id ?? undefined,

//               written_answer:
//                 answer.written_answer ?? '',

//               status: answer.status || (
//                 answer.selected_option_id || answer.written_answer
//                   ? 'ANSWERED'
//                   : undefined
//               )
//             };
//           });
//         }

//         setAnswers(restoredAnswers);
//         answersRef.current = restoredAnswers;

//         // 6. Calculate remaining examination time.
//         const end = getExamDateTime(
//           schedule.exam_date,
//           schedule.end_time
//         );

//         if (!end) {
//           throw new Error(
//             'Invalid examination date or end time.'
//           );
//         }

//         const now = Date.now();

//         const scheduleRemaining = Math.max(
//           0,
//           Math.floor((end.getTime() - now) / 1000)
//         );

//         const durationSeconds =
//           Number(schedule.exam.duration) * 60;

//         const serverRemaining = Number(session.remaining_seconds);

//         const remaining =
//           session.remaining_seconds != null &&
//           Number.isFinite(serverRemaining)
//             ? Math.max(0, serverRemaining)
//             : Math.min(scheduleRemaining, durationSeconds);

//         setTimeLeft(remaining);

//       } catch (err) {
//         console.error(
//           'Exam initialization error:',
//           err.response?.data || err
//         );

//         if (active) {
//           setError(
//             err.response?.data?.message ||
//             err.message ||
//             'Unable to start examination.'
//           );
//         }

//       } finally {
//         if (active) {
//           setLoading(false);
//         }
//       }
//     };

//     init();

//     return () => {
//       active = false;

//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [user?.user_id, scheduleId]);

//   // Submit examination.
//   const handleFinalSubmit = useCallback(async () => {
//     if (
//       submittingRef.current ||
//       !studentExam ||
//       questions.length === 0
//     ) {
//       return;
//     }

//     submittingRef.current = true;
//     setSubmitting(true);
//     setError('');

//     try {
//       const latestAnswers = answersRef.current;

//       const submission = questions.map(q => ({
//         question_id: q.question_id,

//         selected_option_id:
//           latestAnswers[q.question_id]?.selected_option_id ?? null,

//         written_answer:
//           latestAnswers[q.question_id]?.written_answer ?? ''
//       }));

//       await studentService.submitExam(
//         studentExam.student_exam_id,
//         submission
//       );

//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }

//       navigate('/student/results');

//     } catch (err) {
//       console.error(
//         'Exam submission error:',
//         err.response?.data || err
//       );

//       setError(
//         err.response?.data?.message ||
//         'Unable to submit examination. Please try again.'
//       );

//       submittingRef.current = false;
//       setSubmitting(false);
//     }
//   }, [studentExam, questions, navigate]);

//   // Examination timer.
//   useEffect(() => {
//     if (
//       loading ||
//       !studentExam ||
//       submitting ||
//       timeLeft <= 0
//     ) {
//       return;
//     }

//     timerRef.current = setInterval(() => {
//       setTimeLeft(prev => {
//         if (prev <= 1) {
//           if (timerRef.current) {
//             clearInterval(timerRef.current);
//             timerRef.current = null;
//           }

//           // Automatically submit when time expires.
//           setTimeout(() => {
//             handleFinalSubmit();
//           }, 0);

//           return 0;
//         }

//         return prev - 1;
//       });
//     }, 1000);

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [
//     loading,
//     studentExam,
//     submitting,
//     timeLeft === 0,
//     handleFinalSubmit
//   ]);

//   // Format remaining time.
//   const formatTime = seconds => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;

//     if (h > 0) {
//       return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
//     }

//     return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
//   };

//   // Select MCQ option.
//   const handleOptionSelect = (qId, optId) => {
//     if (submitting) return;

//     setAnswers(prev => {
//       const updated = {
//         ...prev,
//         [qId]: {
//           ...prev[qId],
//           selected_option_id: optId,
//           status:
//             prev[qId]?.status === 'MARKED'
//               ? 'MARKED'
//               : 'ANSWERED'
//         }
//       };

//       answersRef.current = updated;
//       return updated;
//     });
//   };

//   // Write theory answer.
//   const handleTextAnswer = (qId, text) => {
//     if (submitting) return;

//     setAnswers(prev => {
//       const updated = {
//         ...prev,
//         [qId]: {
//           ...prev[qId],
//           written_answer: text,
//           status:
//             prev[qId]?.status === 'MARKED'
//               ? 'MARKED'
//               : text.trim()
//                 ? 'ANSWERED'
//                 : undefined
//         }
//       };

//       answersRef.current = updated;
//       return updated;
//     });
//   };

//   // Mark or unmark question for review.
//   const handleMarkReview = qId => {
//     if (submitting) return;

//     setAnswers(prev => {
//       const current = prev[qId] || {};

//       const hasAnswer =
//         current.selected_option_id != null ||
//         Boolean(current.written_answer?.trim());

//       const updated = {
//         ...prev,
//         [qId]: {
//           ...current,
//           status:
//             current.status === 'MARKED'
//               ? (hasAnswer ? 'ANSWERED' : undefined)
//               : 'MARKED'
//         }
//       };

//       answersRef.current = updated;
//       return updated;
//     });
//   };

//   // Loading screen.
//   if (loading) {
//     return (
//       <div style={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         background: 'var(--bg)'
//       }}>
//         <div className="spinner" style={{
//           width: 48,
//           height: 48,
//           borderWidth: 4
//         }} />

//         <h3 style={{ marginTop: 20 }}>
//           Setting up your examination...
//         </h3>

//         <p style={{ color: 'var(--text-muted)' }}>
//           Please do not refresh the page.
//         </p>
//       </div>
//     );
//   }

//   // Error screen.
//   if (error && !examInfo) {
//     return (
//       <div style={{
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: 24
//       }}>
//         <AlertTriangle size={40} color="var(--danger)" />

//         <h2>Unable to load examination</h2>

//         <p>{error}</p>

//         <button
//           className="btn btn-primary"
//           onClick={() => navigate('/student')}
//         >
//           Back to Dashboard
//         </button>
//       </div>
//     );
//   }

//   if (!questions.length || !examInfo) {
//     return null;
//   }

//   const currentQ = questions[currentQIndex];

//   if (!currentQ) return null;

//   const ansState = answers[currentQ.question_id] || {};

//   // Calculate question counts.
//   const answeredCount = questions.filter(q => {
//     const answer = answers[q.question_id];

//     return (
//       answer?.status === 'ANSWERED' ||
//       (
//         answer?.status === 'MARKED' &&
//         (
//           answer.selected_option_id != null ||
//           Boolean(answer.written_answer?.trim())
//         )
//       )
//     );
//   }).length;

//   const markedCount = questions.filter(
//     q => answers[q.question_id]?.status === 'MARKED'
//   ).length;

//   const unansweredCount = questions.length - answeredCount;

//   return (
//     <div style={{
//       minHeight: '100vh',
//       display: 'flex',
//       flexDirection: 'column',
//       background: 'var(--bg)'
//     }}>

//       {/* Exam Header */}
//       <div style={{
//         background: 'white',
//         borderBottom: '1px solid var(--border)',
//         padding: '16px 28px',
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         position: 'sticky',
//         top: 0,
//         zIndex: 100,
//         boxShadow: 'var(--shadow-sm)'
//       }}>
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: 16
//         }}>
//           <div style={{
//             width: 40,
//             height: 40,
//             background: 'var(--info)',
//             color: 'white',
//             borderRadius: 8,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center'
//           }}>
//             <ShieldCheck size={24} />
//           </div>

//           <div>
//             <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
//               {examInfo.exam?.exam_name || 'Examination'}
//             </h2>

//             <p style={{
//               fontSize: '0.8rem',
//               color: 'var(--text-muted)',
//               margin: 0
//             }}>
//               {examInfo.subject?.subject_name || 'Subject'}
//             </p>
//           </div>
//         </div>

//         <div className={`exam-timer ${
//           timeLeft < 300
//             ? 'danger'
//             : timeLeft < 600
//               ? 'warning'
//               : ''
//         }`}>
//           <Clock size={20} />

//           <div style={{
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             lineHeight: 1
//           }}>
//             <span className="timer-value">
//               {formatTime(timeLeft)}
//             </span>

//             <span className="timer-label">
//               Time Remaining
//             </span>
//           </div>
//         </div>
//       </div>

//       <div style={{
//         flex: 1,
//         padding: 28,
//         maxWidth: 1400,
//         margin: '0 auto',
//         width: '100%'
//       }}>
//         {error && (
//           <div className="alert alert-warning" style={{
//             marginBottom: 16
//           }}>
//             <AlertTriangle size={18} />
//             {error}
//           </div>
//         )}

//         <div className="exam-layout">

//           {/* Main Question Area */}
//           <div className="card" style={{
//             minHeight: 600,
//             display: 'flex',
//             flexDirection: 'column'
//           }}>
//             <div className="card-header" style={{
//               background: 'var(--bg)',
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center'
//             }}>
//               <div className="question-number-badge" style={{
//                 margin: 0
//               }}>
//                 Question {currentQIndex + 1} of {questions.length}
//               </div>

//               <div style={{ display: 'flex', gap: 8 }}>
//                 <span className="badge badge-gray">
//                   {currentQ.marks} Mark{currentQ.marks > 1 ? 's' : ''}
//                 </span>

//                 <span className="badge badge-purple">
//                   {currentQ.question_type}
//                 </span>
//               </div>
//             </div>

//             <div className="card-body" style={{
//               flex: 1,
//               padding: 32
//             }}>
//               <div style={{
//                 fontSize: '1.15rem',
//                 fontWeight: 500,
//                 color: 'var(--text-primary)',
//                 lineHeight: 1.6,
//                 marginBottom: 32
//               }}>
//                 {currentQ.question_text}
//               </div>

//               {currentQ.question_type === 'MCQ' ? (
//                 <div>
//                   {currentQ.options?.map((opt, i) => (
//                     <div
//                       key={opt.option_id}
//                       className={`question-option ${
//                         Number(ansState.selected_option_id) === Number(opt.option_id)
//                           ? 'selected'
//                           : ''
//                       }`}
//                       onClick={() => handleOptionSelect(
//                         currentQ.question_id,
//                         opt.option_id
//                       )}
//                       style={{
//                         cursor: submitting ? 'not-allowed' : 'pointer',
//                         pointerEvents: submitting ? 'none' : 'auto'
//                       }}
//                     >
//                       <div className="option-indicator" />

//                       <div style={{ flex: 1 }}>
//                         <span style={{
//                           fontWeight: 600,
//                           marginRight: 8
//                         }}>
//                           {String.fromCharCode(65 + i)}.
//                         </span>

//                         {opt.option_text}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <textarea
//                   className="form-textarea"
//                   style={{
//                     minHeight: 250,
//                     fontSize: '1rem',
//                     padding: 20
//                   }}
//                   placeholder="Type your answer here..."
//                   value={ansState.written_answer || ''}
//                   disabled={submitting}
//                   onChange={e => handleTextAnswer(
//                     currentQ.question_id,
//                     e.target.value
//                   )}
//                 />
//               )}
//             </div>

//             <div className="card-footer" style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               background: 'white'
//             }}>
//               <button
//                 className="btn btn-secondary"
//                 onClick={() => setCurrentQIndex(
//                   prev => Math.max(0, prev - 1)
//                 )}
//                 disabled={currentQIndex === 0 || submitting}
//               >
//                 <ChevronLeft size={18} />
//                 Previous
//               </button>

//               <button
//                 className={`btn ${
//                   ansState.status === 'MARKED'
//                     ? 'btn-warning'
//                     : 'btn-ghost'
//                 }`}
//                 style={{
//                   border: ansState.status === 'MARKED'
//                     ? 'none'
//                     : '1px solid var(--border)'
//                 }}
//                 onClick={() => handleMarkReview(currentQ.question_id)}
//                 disabled={submitting}
//               >
//                 <AlertTriangle size={16} />

//                 {ansState.status === 'MARKED'
//                   ? 'Unmark Review'
//                   : 'Mark for Review'}
//               </button>

//               <button
//                 className="btn btn-primary"
//                 onClick={() => {
//                   if (currentQIndex < questions.length - 1) {
//                     setCurrentQIndex(prev => prev + 1);
//                   } else {
//                     setShowSubmitConfirm(true);
//                   }
//                 }}
//                 disabled={submitting}
//               >
//                 {currentQIndex === questions.length - 1
//                   ? 'Finish'
//                   : 'Next'}

//                 <ChevronRight size={18} />
//               </button>
//             </div>
//           </div>

//           {/* Question Navigator */}
//           <div className="exam-sidebar-panel">
//             <h3 style={{
//               fontSize: '1rem',
//               marginBottom: 16
//             }}>
//               Question Navigator
//             </h3>

//             <div className="question-navigator" style={{
//               marginBottom: 24
//             }}>
//               {questions.map((q, i) => {
//                 const status = answers[q.question_id]?.status;

//                 let btnClass = 'q-nav-btn';

//                 if (i === currentQIndex) {
//                   btnClass += ' current';
//                 } else if (status === 'MARKED') {
//                   btnClass += ' marked';
//                 } else if (status === 'ANSWERED') {
//                   btnClass += ' answered';
//                 }

//                 return (
//                   <button
//                     key={q.question_id}
//                     className={btnClass}
//                     onClick={() => setCurrentQIndex(i)}
//                     disabled={submitting}
//                   >
//                     {i + 1}
//                   </button>
//                 );
//               })}
//             </div>

//             <div className="divider" />

//             <div style={{
//               display: 'flex',
//               flexDirection: 'column',
//               gap: 10,
//               fontSize: '0.8rem',
//               color: 'var(--text-secondary)'
//             }}>
//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 8
//               }}>
//                 <span style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: '50%',
//                   background: 'var(--success)'
//                 }} />

//                 Answered ({answeredCount})
//               </div>

//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 8
//               }}>
//                 <span style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: '50%',
//                   background: 'var(--warning)'
//                 }} />

//                 Marked for Review ({markedCount})
//               </div>

//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 8
//               }}>
//                 <span style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: '50%',
//                   border: '1px solid var(--text-muted)'
//                 }} />

//                 Not Answered ({unansweredCount})
//               </div>
//             </div>

//             <button
//               className="btn btn-success"
//               style={{
//                 width: '100%',
//                 justifyContent: 'center',
//                 marginTop: 32
//               }}
//               onClick={() => setShowSubmitConfirm(true)}
//               disabled={submitting}
//             >
//               <Send size={16} />
//               Submit Exam
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Submit Confirmation Modal */}
//       {showSubmitConfirm && (
//         <div className="modal-overlay">
//           <div className="modal" style={{ maxWidth: 480 }}>
//             <div className="modal-header">
//               <h3 className="modal-title">
//                 Submit Examination?
//               </h3>

//               <button
//                 className="modal-close"
//                 onClick={() => !submitting && setShowSubmitConfirm(false)}
//                 disabled={submitting}
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             <div className="modal-body">
//               <div style={{
//                 textAlign: 'center',
//                 marginBottom: 24
//               }}>
//                 <ShieldCheck
//                   size={56}
//                   color="var(--primary)"
//                   style={{ margin: '0 auto 16px' }}
//                 />

//                 <h2 style={{ fontSize: '1.5rem' }}>
//                   Are you sure?
//                 </h2>

//                 <p style={{ color: 'var(--text-muted)' }}>
//                   You cannot change your answers after submission.
//                 </p>
//               </div>

//               <div style={{
//                 display: 'grid',
//                 gridTemplateColumns: 'repeat(3, 1fr)',
//                 gap: 10,
//                 marginBottom: 20
//               }}>
//                 <div style={{
//                   background: 'var(--success-light)',
//                   color: 'var(--success)',
//                   padding: '12px 8px',
//                   borderRadius: 8,
//                   textAlign: 'center'
//                 }}>
//                   <div style={{
//                     fontSize: '1.2rem',
//                     fontWeight: 700
//                   }}>
//                     {answeredCount}
//                   </div>

//                   <div style={{
//                     fontSize: '0.7rem',
//                     fontWeight: 600,
//                     textTransform: 'uppercase'
//                   }}>
//                     Answered
//                   </div>
//                 </div>

//                 <div style={{
//                   background: 'var(--warning-light)',
//                   color: 'var(--warning)',
//                   padding: '12px 8px',
//                   borderRadius: 8,
//                   textAlign: 'center'
//                 }}>
//                   <div style={{
//                     fontSize: '1.2rem',
//                     fontWeight: 700
//                   }}>
//                     {markedCount}
//                   </div>

//                   <div style={{
//                     fontSize: '0.7rem',
//                     fontWeight: 600,
//                     textTransform: 'uppercase'
//                   }}>
//                     Marked
//                   </div>
//                 </div>

//                 <div style={{
//                   background: 'var(--bg)',
//                   color: 'var(--text-muted)',
//                   padding: '12px 8px',
//                   borderRadius: 8,
//                   textAlign: 'center'
//                 }}>
//                   <div style={{
//                     fontSize: '1.2rem',
//                     fontWeight: 700
//                   }}>
//                     {unansweredCount}
//                   </div>

//                   <div style={{
//                     fontSize: '0.7rem',
//                     fontWeight: 600,
//                     textTransform: 'uppercase'
//                   }}>
//                     Unanswered
//                   </div>
//                 </div>
//               </div>

//               {unansweredCount > 0 && (
//                 <div className="alert alert-warning">
//                   <AlertTriangle size={18} />

//                   <div>
//                     You have <strong>{unansweredCount} unanswered</strong>
//                     {' '}questions. It is recommended to attempt all questions.
//                   </div>
//                 </div>
//               )}

//               {error && (
//                 <div className="alert alert-warning">
//                   {error}
//                 </div>
//               )}
//             </div>

//             <div className="modal-footer">
//               <button
//                 className="btn btn-ghost"
//                 onClick={() => setShowSubmitConfirm(false)}
//                 disabled={submitting}
//               >
//                 Resume Exam
//               </button>

//               <button
//                 className="btn btn-success"
//                 onClick={handleFinalSubmit}
//                 disabled={submitting}
//               >
//                 {submitting ? 'Submitting...' : 'Yes, Submit Exam'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, {
  useEffect,
  useState,
  useRef,
  useCallback
} from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import {
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  X,
  Maximize,
  Minimize
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';

export default function ExamInterfacePage() {
  const { scheduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [studentExam, setStudentExam] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Exam only starts after the student clicks "Start Exam"
  // (browsers require a user click to enter fullscreen).
  const [started, setStarted] = useState(false);

  // Fullscreen state and references.
  const examContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wasFullscreenRef = useRef(false);

  const timerRef = useRef(null);
  const submittingRef = useRef(false);
  const answersRef = useRef({});

  // Keep latest answers available to timer callbacks.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Enter fullscreen (must be called from a user click).
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      wasFullscreenRef.current = true;
      return true;
    } catch (err) {
      console.error('Fullscreen error:', err);
      setError(
        'Unable to enter fullscreen. Fullscreen is required for this examination.'
      );
      return false;
    }
  };

  // Exit fullscreen.
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen exit error:', err);
    }
  };

  // Detect fullscreen changes.
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);

      if (active) {
        wasFullscreenRef.current = true;
      }

      setIsFullscreen(active);
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );

      // Leave fullscreen if the page is closed/navigated away.
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Start button handler: enter fullscreen first, then start the exam.
  const handleStart = async () => {
    setError('');

    const ok = await enterFullscreen();

    if (ok) {
      setStarted(true);
    }
  };

  // Convert exam date and time into a JavaScript Date.
  const getExamDateTime = (date, time) => {
    if (!date || !time) return null;

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return null;

    const datePart = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');

    const result = new Date(
      `${datePart}T${String(time).slice(0, 8)}`
    );

    return Number.isNaN(result.getTime()) ? null : result;
  };

  // Initialize examination (runs only after the student clicks Start).
  useEffect(() => {
    if (!started) return;

    let active = true;

    const init = async () => {
      try {
        if (!user?.user_id) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');

        // 1. Fetch available schedules.
        const exams = await studentService.getAvailableExams();

        console.log('Route schedule ID:', scheduleId);

        console.log(
          'Available schedule IDs:',
          exams.map(e => e.schedule_id)
        );

        // 2. Find schedule using schedule_id.
        const schedule = exams.find(
          e => Number(e.schedule_id) === Number(scheduleId)
        );

        console.log('Matched schedule:', schedule);

        if (!schedule) {
          throw new Error(
            "Examination not found or you don't have access."
          );
        }

        if (!schedule.exam?.exam_id) {
          throw new Error('Exam information is missing.');
        }

        // 3. Start or resume examination.
        const session = await studentService.startExam(
          schedule.schedule_id
        );

        console.log('Student exam session:', session);

        // 4. Fetch questions.
        const qs = await studentService.getExamQuestions(
          schedule.exam.exam_id
        );

        console.log('Exam questions:', qs);

        if (!Array.isArray(qs) || qs.length === 0) {
          throw new Error(
            'No questions are available for this examination.'
          );
        }

        if (!active) return;

        setExamInfo(schedule);
        setStudentExam(session);
        setQuestions(qs);

        // 5. Restore previously saved answers.
        const restoredAnswers = {};

        if (Array.isArray(session.answers)) {
          session.answers.forEach(answer => {
            restoredAnswers[answer.question_id] = {
              selected_option_id:
                answer.selected_option_id ?? undefined,

              written_answer:
                answer.written_answer ?? '',

              status: answer.status || (
                answer.selected_option_id || answer.written_answer
                  ? 'ANSWERED'
                  : undefined
              )
            };
          });
        }

        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;

        // 6. Calculate remaining examination time.
        const end = getExamDateTime(
          schedule.exam_date,
          schedule.end_time
        );

        if (!end) {
          throw new Error(
            'Invalid examination date or end time.'
          );
        }

        const now = Date.now();

        const scheduleRemaining = Math.max(
          0,
          Math.floor((end.getTime() - now) / 1000)
        );

        const durationSeconds =
          Number(schedule.exam.duration) * 60;

        const serverRemaining = Number(session.remaining_seconds);

        const remaining =
          session.remaining_seconds != null &&
          Number.isFinite(serverRemaining)
            ? Math.max(0, serverRemaining)
            : Math.min(scheduleRemaining, durationSeconds);

        setTimeLeft(remaining);

      } catch (err) {
        console.error(
          'Exam initialization error:',
          err.response?.data || err
        );

        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Unable to start examination.'
          );
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      active = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user?.user_id, scheduleId, started]);

  // Submit examination.
  const handleFinalSubmit = useCallback(async () => {
    if (
      submittingRef.current ||
      !studentExam ||
      questions.length === 0
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const latestAnswers = answersRef.current;

      const submission = questions.map(q => ({
        question_id: q.question_id,

        selected_option_id:
          latestAnswers[q.question_id]?.selected_option_id ?? null,

        written_answer:
          latestAnswers[q.question_id]?.written_answer ?? ''
      }));

      await studentService.submitExam(
        studentExam.student_exam_id,
        submission
      );

      // Exit fullscreen after successful submission.
      await exitFullscreen();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      navigate('/student/results');

    } catch (err) {
      console.error(
        'Exam submission error:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        'Unable to submit examination. Please try again.'
      );

      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [studentExam, questions, navigate]);

  // Auto-submit if the student leaves fullscreen before submitting.
  useEffect(() => {
    if (
      !started ||
      !studentExam ||
      isFullscreen ||
      !wasFullscreenRef.current
    ) {
      return;
    }

    // Uses answersRef, so the latest answers are submitted.
    handleFinalSubmit();
  }, [isFullscreen, started, studentExam, handleFinalSubmit]);

  // Examination timer.
  useEffect(() => {
    if (
      loading ||
      !studentExam ||
      submitting ||
      timeLeft <= 0
    ) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Automatically submit when time expires.
          setTimeout(() => {
            handleFinalSubmit();
          }, 0);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    loading,
    studentExam,
    submitting,
    timeLeft === 0,
    handleFinalSubmit
  ]);

  // Format remaining time.
  const formatTime = seconds => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Select MCQ option.
  const handleOptionSelect = (qId, optId) => {
    if (submitting) return;

    setAnswers(prev => {
      const updated = {
        ...prev,
        [qId]: {
          ...prev[qId],
          selected_option_id: optId,
          status:
            prev[qId]?.status === 'MARKED'
              ? 'MARKED'
              : 'ANSWERED'
        }
      };

      answersRef.current = updated;
      return updated;
    });
  };

  // Write theory answer.
  const handleTextAnswer = (qId, text) => {
    if (submitting) return;

    setAnswers(prev => {
      const updated = {
        ...prev,
        [qId]: {
          ...prev[qId],
          written_answer: text,
          status:
            prev[qId]?.status === 'MARKED'
              ? 'MARKED'
              : text.trim()
                ? 'ANSWERED'
                : undefined
        }
      };

      answersRef.current = updated;
      return updated;
    });
  };

  // Mark or unmark question for review.
  const handleMarkReview = qId => {
    if (submitting) return;

    setAnswers(prev => {
      const current = prev[qId] || {};

      const hasAnswer =
        current.selected_option_id != null ||
        Boolean(current.written_answer?.trim());

      const updated = {
        ...prev,
        [qId]: {
          ...current,
          status:
            current.status === 'MARKED'
              ? (hasAnswer ? 'ANSWERED' : undefined)
              : 'MARKED'
        }
      };

      answersRef.current = updated;
      return updated;
    });
  };

  // Covers the whole viewport so the app sidebar/top bar are hidden during the exam.
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    overflowY: 'auto',
    background: 'var(--bg)'
  };

  // Start screen (shown until the student clicks Start Exam).
  if (!started) {
    return (
      <div style={{
        ...overlayStyle,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        background: 'var(--bg)'
      }}>
        <ShieldCheck size={56} color="var(--primary)" />

        <h2 style={{ marginTop: 16 }}>Before you begin</h2>

        <p style={{
          maxWidth: 480,
          color: 'var(--text-muted)'
        }}>
          The examination runs in fullscreen mode. If you exit
          fullscreen (including by pressing Esc), your exam will be
          submitted automatically with the answers you have entered
          so far.
        </p>

        {error && (
          <div className="alert alert-warning" style={{
            marginTop: 12
          }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 20
        }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/student')}
          >
            Back
          </button>

          <button
            className="btn btn-primary"
            onClick={handleStart}
          >
            <Maximize size={16} />
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  // Loading screen.
  if (loading) {
    return (
      <div style={{
        ...overlayStyle,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div className="spinner" style={{
          width: 48,
          height: 48,
          borderWidth: 4
        }} />

        <h3 style={{ marginTop: 20 }}>
          Setting up your examination...
        </h3>

        <p style={{ color: 'var(--text-muted)' }}>
          Please do not refresh the page.
        </p>
      </div>
    );
  }

  // Error screen.
  if (error && !examInfo) {
    return (
      <div style={{
        ...overlayStyle,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <AlertTriangle size={40} color="var(--danger)" />

        <h2>Unable to load examination</h2>

        <p>{error}</p>

        <button
          className="btn btn-primary"
          onClick={async () => {
            await exitFullscreen();
            navigate('/student');
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!questions.length || !examInfo) {
    return null;
  }

  const currentQ = questions[currentQIndex];

  if (!currentQ) return null;

  const ansState = answers[currentQ.question_id] || {};

  // Calculate question counts.
  const answeredCount = questions.filter(q => {
    const answer = answers[q.question_id];

    return (
      answer?.status === 'ANSWERED' ||
      (
        answer?.status === 'MARKED' &&
        (
          answer.selected_option_id != null ||
          Boolean(answer.written_answer?.trim())
        )
      )
    );
  }).length;

  const markedCount = questions.filter(
    q => answers[q.question_id]?.status === 'MARKED'
  ).length;

  const unansweredCount = questions.length - answeredCount;

  return (
    <div
      ref={examContainerRef}
      style={{
        ...overlayStyle,
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)'
      }}
    >

      {/* Fullscreen warning (only visible if a failed auto-submit left the exam open) */}
      {!isFullscreen && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '12px 20px',
          textAlign: 'center',
          borderBottom: '1px solid #ffe69c',
          position: 'sticky',
          top: 0,
          zIndex: 200
        }}>
          <strong>Fullscreen is not active.</strong>
          {' '}Please return to fullscreen to continue your examination.

          <button
            className="btn btn-primary"
            onClick={enterFullscreen}
            disabled={submitting}
            style={{ marginLeft: 12 }}
          >
            <Maximize size={16} />
            Return to Fullscreen
          </button>
        </div>
      )}

      {/* Exam Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--border)',
        padding: '16px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'var(--info)',
            color: 'white',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
              {examInfo.exam?.exam_name || 'Examination'}
            </h2>

            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              margin: 0
            }}>
              {examInfo.subject?.subject_name || 'Subject'}
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          {/* Fullscreen status (exiting submits the exam) */}
          <button
            className="btn btn-secondary"
            onClick={enterFullscreen}
            disabled={submitting || isFullscreen}
            title={
              isFullscreen
                ? 'Exiting fullscreen will submit your exam'
                : 'Enter fullscreen'
            }
          >
            {isFullscreen
              ? <Minimize size={17} />
              : <Maximize size={17} />
            }

            {isFullscreen ? 'Fullscreen Active' : 'Enter Full Screen'}
          </button>

          {/* Timer */}
          <div className={`exam-timer ${
            timeLeft < 300
              ? 'danger'
              : timeLeft < 600
                ? 'warning'
                : ''
          }`}>
            <Clock size={20} />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1
            }}>
              <span className="timer-value">
                {formatTime(timeLeft)}
              </span>

              <span className="timer-label">
                Time Remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: 28,
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%'
      }}>
        {error && (
          <div className="alert alert-warning" style={{
            marginBottom: 16
          }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="exam-layout">

          {/* Main Question Area */}
          <div className="card" style={{
            minHeight: 600,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="card-header" style={{
              background: 'var(--bg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="question-number-badge" style={{
                margin: 0
              }}>
                Question {currentQIndex + 1} of {questions.length}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-gray">
                  {currentQ.marks} Mark{currentQ.marks > 1 ? 's' : ''}
                </span>

                <span className="badge badge-purple">
                  {currentQ.question_type}
                </span>
              </div>
            </div>

            <div className="card-body" style={{
              flex: 1,
              padding: 32
            }}>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                marginBottom: 32
              }}>
                {currentQ.question_text}
              </div>

              {currentQ.question_type === 'MCQ' ? (
                <div>
                  {currentQ.options?.map((opt, i) => (
                    <div
                      key={opt.option_id}
                      className={`question-option ${
                        Number(ansState.selected_option_id) === Number(opt.option_id)
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => handleOptionSelect(
                        currentQ.question_id,
                        opt.option_id
                      )}
                      style={{
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        pointerEvents: submitting ? 'none' : 'auto'
                      }}
                    >
                      <div className="option-indicator" />

                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontWeight: 600,
                          marginRight: 8
                        }}>
                          {String.fromCharCode(65 + i)}.
                        </span>

                        {opt.option_text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  className="form-textarea"
                  style={{
                    minHeight: 250,
                    fontSize: '1rem',
                    padding: 20
                  }}
                  placeholder="Type your answer here..."
                  value={ansState.written_answer || ''}
                  disabled={submitting}
                  onChange={e => handleTextAnswer(
                    currentQ.question_id,
                    e.target.value
                  )}
                />
              )}
            </div>

            <div className="card-footer" style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'white'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentQIndex(
                  prev => Math.max(0, prev - 1)
                )}
                disabled={currentQIndex === 0 || submitting}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <button
                className={`btn ${
                  ansState.status === 'MARKED'
                    ? 'btn-warning'
                    : 'btn-ghost'
                }`}
                style={{
                  border: ansState.status === 'MARKED'
                    ? 'none'
                    : '1px solid var(--border)'
                }}
                onClick={() => handleMarkReview(currentQ.question_id)}
                disabled={submitting}
              >
                <AlertTriangle size={16} />

                {ansState.status === 'MARKED'
                  ? 'Unmark Review'
                  : 'Mark for Review'}
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  if (currentQIndex < questions.length - 1) {
                    setCurrentQIndex(prev => prev + 1);
                  } else {
                    setShowSubmitConfirm(true);
                  }
                }}
                disabled={submitting}
              >
                {currentQIndex === questions.length - 1
                  ? 'Finish'
                  : 'Next'}

                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="exam-sidebar-panel">
            <h3 style={{
              fontSize: '1rem',
              marginBottom: 16
            }}>
              Question Navigator
            </h3>

            <div className="question-navigator" style={{
              marginBottom: 24
            }}>
              {questions.map((q, i) => {
                const status = answers[q.question_id]?.status;

                let btnClass = 'q-nav-btn';

                if (i === currentQIndex) {
                  btnClass += ' current';
                } else if (status === 'MARKED') {
                  btnClass += ' marked';
                } else if (status === 'ANSWERED') {
                  btnClass += ' answered';
                }

                return (
                  <button
                    key={q.question_id}
                    className={btnClass}
                    onClick={() => setCurrentQIndex(i)}
                    disabled={submitting}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="divider" />

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--success)'
                }} />

                Answered ({answeredCount})
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--warning)'
                }} />

                Marked for Review ({markedCount})
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  border: '1px solid var(--text-muted)'
                }} />

                Not Answered ({unansweredCount})
              </div>
            </div>

            <button
              className="btn btn-success"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 32
              }}
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
            >
              <Send size={16} />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Submit Examination?
              </h3>

              <button
                className="modal-close"
                onClick={() => !submitting && setShowSubmitConfirm(false)}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                textAlign: 'center',
                marginBottom: 24
              }}>
                <ShieldCheck
                  size={56}
                  color="var(--primary)"
                  style={{ margin: '0 auto 16px' }}
                />

                <h2 style={{ fontSize: '1.5rem' }}>
                  Are you sure?
                </h2>

                <p style={{ color: 'var(--text-muted)' }}>
                  You cannot change your answers after submission.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 20
              }}>
                <div style={{
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                  padding: '12px 8px',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}>
                    {answeredCount}
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Answered
                  </div>
                </div>

                <div style={{
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  padding: '12px 8px',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}>
                    {markedCount}
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Marked
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                  padding: '12px 8px',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 700
                  }}>
                    {unansweredCount}
                  </div>

                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    Unanswered
                  </div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} />

                  <div>
                    You have <strong>{unansweredCount} unanswered</strong>
                    {' '}questions. It is recommended to attempt all questions.
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-warning">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
              >
                Resume Exam
              </button>

              <button
                className="btn btn-success"
                onClick={handleFinalSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}