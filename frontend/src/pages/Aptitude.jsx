import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ArrowLeft, Folder, CheckCircle, XCircle } from 'lucide-react';

const SECTION_MAP = {
    "General Aptitude": ["Arithmetic Aptitude", "Data Interpretation", "Online Aptitude Test", "Data Interpretation Test"],
    "Verbal and Reasoning": ["Verbal Ability", "Logical Reasoning", "Verbal Reasoning", "Non Verbal Reasoning"],
    "Current Affairs & GK": ["Current Affairs", "Basic General Knowledge", "General Science"],
    "Interview": ["Placement Papers", "Group Discussion", "HR Interview"],
    "Engineering": ["Mechanical Engineering", "Civil Engineering", "ECE, EEE, CSE", "Chemical Engineering"],
    "Programming": ["C Programming", "C++ Programming", "C# Programming", "Java Programming"],
    "Online Tests": ["Aptitude Test", "Verbal Ability Test", "Logical Reasoning Test", "C Programming Test"],
    "Technical MCQs": ["Networking Questions", "Database Questions", "Basic Electronics", "Digital Electronics"],
    "Technical Short Answers": ["Software Testing", "The C Language Basics", "SQL Server", "Networking"],
    "Medical Science": ["Microbiology", "Biochemistry", "Biotechnology", "Biochemical Engineering"],
    "Puzzles": ["Sudoku", "Number puzzles", "Missing letters puzzles", "Logical puzzles", "Clock puzzles"]
};

export default function Aptitude() {
    const [fetchedCategories, setFetchedCategories] = useState([]);
    
    // UI State
    const [selectedMainCategory, setSelectedMainCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    
    // Data State
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedAnswers, setExpandedAnswers] = useState({});
    
    // Interactive State
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:8001/aptitude/categories');
            const data = await res.json();
            setFetchedCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchQuestions = async (category) => {
        let parentCategory = null;
        for (const [main, subs] of Object.entries(SECTION_MAP)) {
            if (subs.includes(category)) {
                parentCategory = main;
                break;
            }
        }

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8001/aptitude/questions/${category}`);
            const data = await res.json();
            setQuestions(data);
            setSelectedSubCategory(category);
            setSelectedMainCategory(parentCategory);
            setExpandedAnswers({}); 
            setSelectedAnswers({}); // Reset previous selections
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (questionId, option) => {
        // Can't change answer if already viewed or answered
        if (expandedAnswers[questionId] || selectedAnswers[questionId]) return;
        
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
        
        // Auto-expand to immediately reveal correctness and explanation
        setExpandedAnswers(prev => ({
            ...prev,
            [questionId]: true
        }));
    };

    const toggleAnswer = (questionId) => {
        setExpandedAnswers(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleBackToMain = () => {
        setSelectedMainCategory(null);
        setSelectedSubCategory(null);
        setQuestions([]);
    };

    const handleBackToSubs = () => {
        setSelectedSubCategory(null);
        setQuestions([]);
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

    if (!selectedMainCategory && !selectedSubCategory) {
        return (
            <div className="page-container">
                <header style={{ marginBottom: '3rem' }}>
                    <h1>Aptitude Masterclass</h1>
                    <p>Strengthen your foundation with industry-standard aptitude modules.</p>
                </header>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {Object.keys(SECTION_MAP).map((mainCat, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedMainCategory(mainCat)}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.25rem',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            <div style={{ 
                                padding: '1rem', 
                                background: 'rgba(139, 92, 246, 0.08)', 
                                borderRadius: '16px', 
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Folder size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: '#fff' }}>{mainCat}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem' }}>{SECTION_MAP[mainCat].length} Topics</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (selectedMainCategory && !selectedSubCategory) {
        return (
            <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <button onClick={handleBackToMain} className="nav-item" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1.25rem' }}>
                    <ArrowLeft size={18} /> <span>Back to Sections</span>
                </button>
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className="brand-dot"></div>
                        <span style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>Practice Path</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff' }}>{selectedMainCategory}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Master these core competencies through targeted practice sessions.</p>
                </header>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {SECTION_MAP[selectedMainCategory].map((subTitle, idx) => {
                        const isAvailable = fetchedCategories.includes(subTitle);
                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (isAvailable) fetchQuestions(subTitle);
                                    else alert('Topic content is being prepared. Please check back in a few moments!');
                                }}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.3s ease',
                                    opacity: isAvailable ? 1 : 0.6,
                                    background: isAvailable ? 'var(--glass-bg)' : 'rgba(255,255,255,0.02)',
                                    border: isAvailable ? '1px solid var(--glass-border)' : '1px dashed var(--glass-border)'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontWeight: '700', color: isAvailable ? '#fff' : 'var(--text-muted)', fontSize: '1.05rem' }}>{subTitle}</span>
                                    <span className="text-sm" style={{ color: isAvailable ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                        {isAvailable ? "Ready to practice" : "Generating..."}
                                    </span>
                                </div>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: isAvailable ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary)',
                                    fontSize: '1.2rem'
                                }}>
                                    {isAvailable ? '→' : '...'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 3: Questions List
    return (
        <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <button onClick={handleBackToMain} className="nav-item" style={{ margin: 0, padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)' }}>
                    <ArrowLeft size={16} /> <span style={{ opacity: 0.7 }}>Sections</span>
                </button>
                <button onClick={handleBackToSubs} className="nav-item active" style={{ margin: 0, padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{selectedSubCategory}</span>
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', maxWidth: '1000px', margin: '0 auto' }}>
                {questions.length > 0 ? questions.map((q, idx) => (
                    <div key={q.id} className="card" style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        padding: 0, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2.5rem',
                        animation: `slideInUp ${0.3 + idx * 0.1}s ease-out`
                    }}>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ 
                                minWidth: '46px', 
                                height: '46px', 
                                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', 
                                borderRadius: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '900',
                                fontSize: '1.1rem',
                                boxShadow: '0 4px 15px var(--primary-glow)'
                            }}>
                                {idx + 1}
                            </div>
                            <h3 style={{ fontSize: '1.4rem', lineHeight: '1.5', color: '#fff', fontWeight: '500', margin: 0 }}>
                                {q.question_text || q.question}
                            </h3>
                        </div>

                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {['A', 'B', 'C', 'D'].map((optKey, i) => {
                                const optionText = optKey === 'A' ? q.option_a : optKey === 'B' ? q.option_b : optKey === 'C' ? q.option_c : q.option_d;
                                const isSelected = selectedAnswers[q.id] === optKey;
                                const isCorrect = q.correct_option === optKey;
                                const showOutcome = expandedAnswers[q.id];

                                let cardBg = 'rgba(255, 255, 255, 0.02)';
                                let borderCol = 'var(--glass-border)';
                                let glow = 'none';

                                if (showOutcome) {
                                    if (isCorrect) {
                                        cardBg = 'rgba(16, 185, 129, 0.12)';
                                        borderCol = 'var(--success)';
                                        glow = '0 0 20px rgba(16, 185, 129, 0.1)';
                                    } else if (isSelected) {
                                        cardBg = 'rgba(239, 68, 68, 0.12)';
                                        borderCol = 'var(--danger)';
                                    }
                                } else if (isSelected) {
                                    borderCol = 'var(--primary)';
                                    cardBg = 'rgba(139, 92, 246, 0.05)';
                                }

                                return (
                                    <div
                                        key={optKey}
                                        onClick={() => handleSelectOption(q.id, optKey)}
                                        className="card"
                                        style={{
                                            padding: '1.5rem',
                                            cursor: showOutcome ? 'default' : 'pointer',
                                            background: cardBg,
                                            borderColor: borderCol,
                                            boxShadow: glow,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1.25rem',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            margin: 0
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            fontWeight: '900',
                                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                            background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}>
                                            {optKey}
                                        </div>
                                        <div style={{ flex: 1, fontSize: '1.05rem', color: isSelected ? '#fff' : 'var(--text-secondary)', fontWeight: isSelected ? '700' : '400' }}>{optionText}</div>
                                        {showOutcome && isCorrect && <CheckCircle size={22} color="var(--success)" />}
                                        {showOutcome && isSelected && !isCorrect && <XCircle size={22} color="var(--danger)" />}
                                    </div>
                                );
                            })}
                        </div>

                        {expandedAnswers[q.id] && (
                            <div style={{ 
                                animation: 'fadeIn 0.5s ease-out',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--glass-border)',
                                borderLeft: `5px solid ${q.correct_option === selectedAnswers[q.id] ? 'var(--success)' : 'var(--warning)'}`,
                                borderRadius: '16px',
                                padding: '2rem',
                                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.4)'
                            }}>
                                <div style={{ fontWeight: '800', marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: q.correct_option === selectedAnswers[q.id] ? 'var(--success)' : 'var(--warning)', boxShadow: q.correct_option === selectedAnswers[q.id] ? '0 0 10px var(--success)' : '0 0 10px var(--warning)' }}></div>
                                    Expert Explanation
                                    <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: '400' }}>• Correct Option: {q.correct_option}</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem' }}>{q.explanation}</div>
                            </div>
                        )}
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--glass-border) 0%, transparent 100%)', marginTop: '1.5rem', opacity: 0.3 }}></div>
                    </div>
                )) : (
                    <div className="card" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(15, 23, 42, 0.3)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Questions Found</h3>
                        <p className="text-muted">We couldn't find any practice material for this specific topic at the moment.</p>
                        <button onClick={handleBackToSubs} className="btn primary" style={{ marginTop: '2rem' }}>Explore Other Topics</button>
                    </div>
                )}
            </div>
        </div>
    );
}
