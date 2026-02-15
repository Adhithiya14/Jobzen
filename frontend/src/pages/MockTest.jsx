import React, { useState, useEffect, useRef } from 'react';
import { Play, Send, Award, RefreshCw, Briefcase, Mic, MicOff, Camera, Volume2, Video } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function MockTest() {
    const location = useLocation();
    const videoRef = useRef(null);
    const recognitionRef = useRef(null);

    // Setup State
    const [role, setRole] = useState('Software Engineer');
    const [testType, setTestType] = useState('Technical');
    const [hasPermissions, setHasPermissions] = useState(false);

    // Interview State
    const [interviewMode, setInterviewMode] = useState('single');
    const [currentRound, setCurrentRound] = useState(1);
    const [qCount, setQCount] = useState(0);

    const [questionHistory, setQuestionHistory] = useState([]);
    const [questionData, setQuestionData] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('setup'); // setup, round-intro, interview, feedback, complete

    // Media State
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);


    const [difficulty, setDifficulty] = useState('Beginner');

    const ROUNDS = {
        1: { name: 'Introduction', type: 'HR', limit: 2 },
        2: { name: 'Technical Deep Dive', type: 'Technical', limit: 3 },
        3: { name: 'Behavioral / Culture Fit', type: 'HR', limit: 2 }
    };

    // --- Init & Permissions ---
    useEffect(() => {
        if (location.state?.role) {
            setRole(location.state.role);
        }

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                // Append to existing answer or just update
                if (finalTranscript) {
                    setUserAnswer(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech error", event);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    setIsListening(false);
                }
            }
        }
    }, [location]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasPermissions(true);
        } catch (err) {
            alert("Camera/Mic access is required for the Video Interview experience.");
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setHasPermissions(false);
    };

    // --- TTS Logic ---
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsAiSpeaking(true);
            utterance.onend = () => setIsAiSpeaking(false);

            // Pick a nice voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
        }
    };

    // --- STT Logic ---
    const toggleMic = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser. Please use Chrome.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            stopSpeaking(); // Stop AI if user interrupts
        }
    };

    // --- Interview Flow ---

    const startFullInterview = async () => {
        await startCamera();
        setInterviewMode('full');
        setCurrentRound(1);
        setQCount(0);
        setDifficulty('Beginner');
        setQuestionHistory([]);
        setTestType('HR'); // Start with HR/Intro
        setStep('round-intro');
    };


    const fetchQuestion = async (context = {}) => {
        if (loading) return;
        setLoading(true);
        stopSpeaking();
        try {
            let typeToSend = testType;
            if (interviewMode === 'full') {
                typeToSend = ROUNDS[currentRound].type;
            }

            const response = await fetch('http://localhost:8001/interview/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    type: typeToSend,
                    history: questionHistory,
                    previous_question: context.question,
                    user_answer: context.answer,
                    previous_score: context.score,
                    current_level: difficulty
                }),
            });
            const data = await response.json();
            setQuestionData(data);
            if (data.difficulty) setDifficulty(data.difficulty);
            setQuestionHistory(prev => [...prev, data.question]);
            setStep('interview');
            setFeedback(null);
            setUserAnswer('');

            // Auto-Speak Question
            setTimeout(() => speakText(data.question), 500);

        } catch (err) {
            alert("Failed to fetch question.");
            setStep('setup');
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!userAnswer && !userAnswer.trim()) return;
        setLoading(true);
        stopSpeaking();
        if (isListening) toggleMic(); // Stop listening

        try {
            const response = await fetch('http://localhost:8001/interview/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: questionData.question,
                    answer: userAnswer,
                    role: role
                }),
            });
            const data = await response.json();
            setFeedback(data);
            setStep('feedback');

            // Auto-speak feedback highlights
            const shortFeedback = `You scored ${data.score} out of 100. ${data.feedback.split('.')[0]}.`;
            setTimeout(() => speakText(shortFeedback), 500);

        } catch (err) {
            alert("Failed to submit answer.");
        } finally {
            setLoading(false);
        }
    };

    const nextQuestion = () => {
        const lastContext = {
            question: questionData?.question,
            answer: userAnswer,
            score: feedback?.score
        };

        stopSpeaking();
        setFeedback(null); // Clear previous feedback immediately
        setUserAnswer(''); // Clear previous answer

        if (interviewMode === 'single') {
            fetchQuestion(lastContext);
            return;
        }
        const nextQ = qCount + 1;
        if (nextQ >= ROUNDS[currentRound].limit) {
            if (currentRound >= 3) {
                setStep('complete');
                stopCamera();
            } else {
                setCurrentRound(prev => prev + 1);
                setQCount(0);
                setStep('round-intro');
            }
        } else {
            setQCount(nextQ);
            fetchQuestion(lastContext);
        }
    };


    // --- Render ---
    return (
        <div className="page-container" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Setup Screen */}
            {step === 'setup' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '3rem', textAlign: 'center' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', color: 'var(--primary)', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                            <Video size={40} />
                        </div>
                        <h2 style={{ marginTop: 0, color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem' }}>AI Video Interview</h2>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>Experience a realistic, multi-round interview environment with AI voice and real-time webcam feedback.</p>

                        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', margin: '0 0 0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>TARGET ROLE</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g. Frontend Developer"
                                style={{ marginBottom: '0.5rem' }}
                            />
                        </div>

                        <button onClick={startFullInterview} className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}>
                            <Camera size={22} /> Start Full Simulation
                        </button>
                    </div>
                </div>
            )}

            {/* Main Video Interface */}
            {(step === 'interview' || step === 'feedback' || step === 'round-intro') && (
                <div className="interview-layout">

                    {/* Left: Video Feed & Questions */}
                    <div className="video-frame">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="video-feed"
                        />

                        {/* Status Badge */}
                        <div className="rec-badge">
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', boxShadow: '0 0 8px red' }}></div>
                            <span>REC</span>
                        </div>

                        {/* Overlay: AI Question */}
                        {step === 'interview' && questionData && (
                            <div className="question-overlay">
                                <div className="ai-status" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Video size={16} /> AI INTERVIEWER {isAiSpeaking && <Volume2 size={16} className="pulse" />}
                                    </div>
                                    <div className="badge" style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                        {difficulty.toUpperCase()}
                                    </div>
                                </div>
                                <h3 className="question-text">{questionData.question}</h3>
                                {questionData.hint && (
                                    <div style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent)', fontSize: '0.9rem', color: 'var(--text-secondary)', animation: 'fadeIn 0.5s ease-out' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent)', marginRight: '0.5rem' }}>HINT:</span>
                                        {questionData.hint}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Round Intro Overlay */}
                        {step === 'round-intro' && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 15, 21, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                                <h1 style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Round {currentRound}</h1>
                                <h2 style={{ color: 'var(--text-secondary)' }}>{ROUNDS[currentRound].name}</h2>
                                <button onClick={fetchQuestion} className="btn primary" style={{ marginTop: '2rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>
                                    Begin Round
                                </button>
                            </div>
                        )}

                        {/* Feedback Overlay */}
                        {step === 'feedback' && feedback && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 15, 21, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', zIndex: 50 }}>
                                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: feedback.score > 70 ? 'var(--success)' : 'var(--warning)', marginBottom: '0.5rem' }}>
                                    {feedback.score}/100
                                </div>
                                <h3 style={{ margin: '0 0 1rem', color: 'white' }}>Feedback</h3>
                                <p style={{ fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6, marginBottom: '2rem', color: 'var(--text-secondary)' }}>{feedback.feedback}</p>

                                {feedback.correct_answer_summary && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '0.5rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
                                        <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>✅ CORRECT ANSWER / IDEAL RESPONSE</div>
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#d1fae5' }}>{feedback.correct_answer_summary}</p>
                                    </div>
                                )}

                                <button
                                    onClick={nextQuestion}
                                    className="btn primary"
                                    style={{ padding: '1rem 3rem' }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="spin" size={20} /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            Next Question <Play size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right: Controls & Transcript */}
                    <div className="control-panel">
                        <div className="answer-card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                            {step === 'feedback' && feedback ? (
                                /* --- Feedback / Result Mode --- */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                                    <div className="answer-card-header">
                                        <h3>Performance Result</h3>
                                        <div className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                            COMPLETED
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>SCORE</div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1, color: feedback.score > 70 ? 'var(--success)' : 'var(--warning)' }}>
                                            {feedback.score}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/100</span>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Analysis</h4>
                                        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                            {feedback.feedback}
                                        </p>

                                        {feedback.correct_answer_summary && (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '0.5rem' }}>
                                                <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Award size={16} /> IDEAL APPROACH
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#d1fae5', lineHeight: 1.5 }}>
                                                    {feedback.correct_answer_summary}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={nextQuestion}
                                        className="btn primary"
                                        style={{ justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', marginTop: 'auto' }}
                                        disabled={loading}
                                    >
                                        {loading ? <RefreshCw className="spin" size={20} /> : <Play size={20} />} Next Question
                                    </button>
                                </div>
                            ) : (
                                /* --- Input / Answer Mode --- */
                                <>
                                    <div className="answer-card-header">
                                        <h3>Your Answer</h3>
                                        <div className="badge" style={{ background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.1)', color: isListening ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                            {isListening ? '● LISTENING' : 'READY'}
                                        </div>
                                    </div>

                                    <textarea
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="State your answer clearly..."
                                        className="answer-input"
                                    />

                                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: 'auto' }}>
                                        <button
                                            onClick={toggleMic}
                                            className="btn"
                                            style={{
                                                background: isListening ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
                                                border: isListening ? 'none' : '1px solid var(--border)',
                                                color: isListening ? 'white' : 'var(--text-primary)',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {isListening ? <><MicOff size={20} /> Stop</> : <><Mic size={20} /> Record</>}
                                        </button>

                                        <button
                                            onClick={submitAnswer}
                                            className="btn primary"
                                            disabled={!userAnswer.trim() || loading}
                                            style={{ justifyContent: 'center' }}
                                        >
                                            {loading ? <RefreshCw className="spin" size={20} /> : <Send size={20} />} Submit
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Tips Card */}
                        <div className="card" style={{ padding: '1rem 1.5rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: 'var(--accent)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Tip</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {step === 'feedback'
                                    ? "Review the AI's feedback to understand which key points you missed."
                                    : "Maintain steady eye contact. Speak at a measured pace. The AI rates confidence based on clarity and keyword usage."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Screen */}
            {step === 'complete' && (
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '4rem auto', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Interview Complete!</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                        You've completed the full simulation. Head back to the dashboard to review your progress.
                    </p>
                    <button onClick={() => setStep('setup')} className="btn primary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
                        Back to Dashboard
                    </button>
                </div>
            )}

            <style>{`
                .pulse { animation: pulse-animation 1.5s infinite; }
                @keyframes pulse-animation {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
