import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

export default function Aptitude() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // State to track which questions have "View Answer" toggled on
    // { [questionId]: boolean }
    const [expandedAnswers, setExpandedAnswers] = useState({});

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:8001/aptitude/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchQuestions = async (category) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8001/aptitude/questions/${category}`);
            const data = await res.json();
            setQuestions(data);
            setSelectedCategory(category);
            setExpandedAnswers({}); // Reset expansions
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAnswer = (questionId) => {
        setExpandedAnswers(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setQuestions([]);
    };

    if (loading) return <div className="page-container" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

    // Category Selection View
    if (!selectedCategory) {
        return (
            <div className="page-container">
                <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen color="var(--primary)" /> Aptitude Questions
                </h1>

                <div className="grid">
                    {categories.length === 0 && (
                        <div className="card col-span-full" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No categories found. Is the backend running?
                        </div>
                    )}
                    {categories.map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => fetchQuestions(cat)}
                            className="card"
                            style={{
                                textAlign: 'left',
                                cursor: 'pointer',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{cat}</h3>
                            <span className="text-sm text-muted">Practice Questions</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Questions List View
    return (
        <div className="page-container">
            <div style={{ display: 'flex', itemsAlign: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={handleBackToCategories} className="icon-btn" title="Back">
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0 }}>{selectedCategory} Questions</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {questions.map((q, idx) => {
                    const isExpanded = expandedAnswers[q.id];
                    return (
                        <div key={q.id} className="card">
                            {/* Question Number & Text */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)', minWidth: '24px' }}>{idx + 1}.</span>
                                <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{q.question}</p>
                            </div>

                            {/* Options */}
                            <div style={{ marginLeft: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>(A)</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{q.option_a}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>(B)</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{q.option_b}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>(C)</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{q.option_c}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>(D)</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{q.option_d}</span>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div style={{ marginLeft: '2.5rem' }}>
                                <button
                                    onClick={() => toggleAnswer(q.id)}
                                    className="btn"
                                    style={{
                                        background: isExpanded ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-dark)',
                                        color: isExpanded ? 'var(--success)' : 'var(--text-primary)',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {isExpanded ? 'Hide Answer' : 'View Answer'}
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {/* Expanded Answer Section */}
                                {isExpanded && (
                                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                                        <p style={{ marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Answer:</span> Option <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{q.correct_option}</span>
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Explanation:</span>
                                            <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{q.explanation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {questions.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No questions available in this category.</div>}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button onClick={handleBackToCategories} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                    Back to all categories
                </button>
            </div>
        </div>
    );
}
