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

    // View 1: Main Categories
    if (!selectedMainCategory && !selectedSubCategory) {
        return (
            <div className="page-container">
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen color="var(--primary)" /> Aptitude Sections
                </h1>
                
                <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Select a main section to explore topics:</div>

                <div className="grid">
                    {Object.keys(SECTION_MAP).map((mainCat, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedMainCategory(mainCat)}
                            className="card"
                            style={{
                                textAlign: 'left',
                                cursor: 'pointer',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <Folder size={24} color="var(--primary)" />
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem', margin: 0 }}>{mainCat}</h3>
                                <span className="text-sm text-muted">{SECTION_MAP[mainCat].length} Topics</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // View 2: Sub Categories
    if (selectedMainCategory && !selectedSubCategory) {
        return (
            <div className="page-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={handleBackToMain} className="icon-btn" title="Back to All Sections">
                        <ArrowLeft size={24} color="var(--primary)" />
                    </button>
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder color="var(--primary)" /> {selectedMainCategory}
                    </h1>
                </div>

                <div className="grid">
                    {SECTION_MAP[selectedMainCategory].map((subCat, idx) => {
                        const isAvailable = fetchedCategories.includes(subCat);
                        return (
                        <button
                            key={idx}
                            onClick={() => {
                                if (isAvailable) fetchQuestions(subCat);
                                else alert('Questions for this topic are currently being generated in the background. Please try again in a few minutes!');
                            }}
                            className="card"
                            style={{
                                textAlign: 'left',
                                cursor: 'pointer',
                                background: 'var(--bg-card)',
                                border: isAvailable ? '1px solid var(--border)' : '1px dashed var(--border)',
                                opacity: isAvailable ? 1 : 0.7,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if(isAvailable) e.currentTarget.style.borderColor = 'var(--primary)'
                            }}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = isAvailable ? 'var(--border)' : 'var(--border)'}
                            title={!isAvailable ? 'Generating questions...' : 'Click to practice'}
                        >
                            <h3 style={{ color: isAvailable ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                {subCat}
                            </h3>
                            <span className="text-sm text-muted">
                                {isAvailable ? "Practice Questions" : "Questions generating..."}
                            </span>
                        </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 3: Questions List
    return (
        <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={handleBackToSubs} className="icon-btn" title="Back to Topics">
                    <ArrowLeft size={24} color="var(--primary)" />
                </button>
                <div>
                    <span style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>{selectedMainCategory} /</span>
                    <h2 style={{ margin: 0 }}>{selectedSubCategory} ({questions.length})</h2>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {questions.map((q, idx) => {
                    const isExpanded = expandedAnswers[q.id];
                    const selectedOpt = selectedAnswers[q.id];

                    return (
                        <div key={q.id} className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)', minWidth: '24px' }}>{idx + 1}.</span>
                                <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{q.question}</p>
                            </div>

                            <div style={{ marginLeft: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                {['A', 'B', 'C', 'D'].map((optKey) => {
                                    const optionText = optKey === 'A' ? q.option_a : optKey === 'B' ? q.option_b : optKey === 'C' ? q.option_c : q.option_d;
                                    const isSelected = selectedOpt === optKey;
                                    const isCorrect = isExpanded && q.correct_option === optKey;
                                    const isWrong = isExpanded && isSelected && q.correct_option !== optKey;

                                    let borderColor = 'var(--border)';
                                    let bgColor = 'var(--bg-card)';
                                    let textColor = 'var(--text-muted)';
                                    let icon = null;

                                    if (isCorrect) {
                                        borderColor = '#10b981'; // tailwind emerald-500
                                        bgColor = 'rgba(16, 185, 129, 0.1)';
                                        textColor = '#10b981';
                                        icon = <CheckCircle size={18} color="#10b981" />;
                                    } else if (isWrong) {
                                        borderColor = '#ef4444'; // tailwind red-500
                                        bgColor = 'rgba(239, 68, 68, 0.1)';
                                        textColor = '#ef4444';
                                        icon = <XCircle size={18} color="#ef4444" />;
                                    } else if (isSelected) {
                                        borderColor = 'var(--primary)';
                                        bgColor = 'rgba(56, 189, 248, 0.1)'; // soft primary
                                        textColor = 'var(--text-primary)';
                                    }

                                    return (
                                        <button
                                            key={optKey}
                                            onClick={() => handleSelectOption(q.id, optKey)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem 1rem',
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: 'var(--radius-sm)',
                                                background: bgColor,
                                                cursor: isExpanded ? 'default' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'left'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isExpanded && !isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (!isExpanded && !isSelected) {
                                                    e.currentTarget.style.borderColor = borderColor;
                                                }
                                            }}
                                        >
                                            <span style={{ fontWeight: 'bold', color: isSelected || isCorrect || isWrong ? 'inherit' : 'var(--text-secondary)' }}>
                                                ({optKey})
                                            </span>
                                            <span style={{ color: textColor, flex: 1 }}>{optionText}</span>
                                            {icon}
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ marginLeft: '2.5rem' }}>
                                <button
                                    onClick={() => toggleAnswer(q.id)}
                                    className="btn"
                                    style={{
                                        background: isExpanded ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-dark)',
                                        color: isExpanded ? '#10b981' : 'var(--text-primary)',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.9rem',
                                        padding: '0.5rem 1rem'
                                    }}
                                >
                                    {isExpanded ? 'Hide Answer' : 'View Answer'}
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isExpanded && (
                                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                                        <p style={{ marginBottom: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Answer:</span> 
                                            Option <span style={{ fontWeight: 'bold', color: '#10b981' }}>{q.correct_option}</span>
                                            {selectedOpt && (
                                                <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: selectedOpt === q.correct_option ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: selectedOpt === q.correct_option ? '#10b981' : '#ef4444' }}>
                                                    {selectedOpt === q.correct_option ? 'You got it right!' : 'Incorrect answer'}
                                                </span>
                                            )}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Explanation:</span>
                                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{q.explanation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {questions.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                        No questions available in this topic yet.
                    </div>
                )}
            </div>
        </div>
    );
}
