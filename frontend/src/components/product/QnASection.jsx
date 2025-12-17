import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../store/api/api';
import { toast } from 'react-toastify';
import { ThumbUp, QuestionAnswer, Send } from '@mui/icons-material';

const QnASection = ({ productId }) => {
    const { user, token } = useSelector(state => state.auth);
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [answerInputs, setAnswerInputs] = useState({}); // { questionId: text }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (productId) fetchQuestions();
    }, [productId]);

    const fetchQuestions = async () => {
        try {
            const res = await api.get(`/questions/product/${productId}`);
            const questionsData = res.data.data || res.data;

            if (Array.isArray(questionsData)) {
                setQuestions(questionsData);
            } else {
                console.error("Unexpected questions format:", res.data);
                setQuestions([]);
            }
        } catch (err) {
            console.error('Failed to load questions', err);
            setQuestions([]);
        }
    };

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!token) {
            toast.info('Please login to ask a question');
            return;
        }
        if (!newQuestion.trim()) return;

        try {
            setLoading(true);
            await api.post('/questions', { productId, content: newQuestion });
            setNewQuestion('');
            toast.success('Question posted!');
            fetchQuestions();
        } catch (err) {
            toast.error('Failed to post question');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (questionId) => {
        if (!token) {
            toast.info('Please login to answer');
            return;
        }
        const content = answerInputs[questionId];
        if (!content?.trim()) return;

        try {
            await api.post(`/questions/${questionId}/answer`, { content });
            setAnswerInputs(prev => ({ ...prev, [questionId]: '' }));
            toast.success('Answer posted!');
            fetchQuestions();
        } catch (err) {
            toast.error('Failed to post answer');
        }
    };

    const handleUpvote = async (questionId) => {
        if (!token) {
            toast.info('Please login to upvote');
            return;
        }
        try {
            await api.patch(`/questions/${questionId}/upvote`);
            fetchQuestions(); // Refresh to show new count/status
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <QuestionAnswer className="text-indigo-600" />
                Questions & Answers
            </h2>

            {/* Ask Form */}
            <form onSubmit={handleAsk} className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-semibold mb-3">Have a question?</h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        className="flex-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Ask the community about this product..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        Ask
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-8">
                {(!questions || !Array.isArray(questions) || questions.length === 0) ? (
                    <p className="text-center text-gray-500 py-4">
                        {Array.isArray(questions) ? "No questions yet. Be the first to ask!" : "Loading questions..."}
                    </p>
                ) : (
                    questions.map(q => (
                        <div key={q._id} className="border-b border-gray-100 last:border-0 pb-8 last:pb-0">
                            {/* Question */}
                            <div className="flex gap-4 mb-4">
                                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                    <button
                                        onClick={() => handleUpvote(q._id)}
                                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${q.upvotes.includes(user?._id) ? 'text-indigo-600' : 'text-gray-400'}`}
                                    >
                                        <ThumbUp fontSize="small" />
                                    </button>
                                    <span className="text-sm font-bold text-gray-600">{q.upvotes.length}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900">{q.content}</h4>
                                    <p className="text-sm text-gray-500 mt-1">Asked by {q.userId?.name} • {new Date(q.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Answers */}
                            <div className="pl-16 space-y-4">
                                {q.answers.map((ans, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl ${ans.role === 'admin' ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                                        <p className="text-gray-800">{ans.content}</p>
                                        <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-2">
                                            {ans.role === 'admin' && <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] uppercase">Official</span>}
                                            {ans.userId?.name || 'User'} • {new Date(ans.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}

                                {/* Answer Input */}
                                {token && (
                                    <div className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                                            placeholder={`Answer this question...`}
                                            value={answerInputs[q._id] || ''}
                                            onChange={(e) => setAnswerInputs(prev => ({ ...prev, [q._id]: e.target.value }))}
                                        />
                                        <button
                                            onClick={() => handleAnswer(q._id)}
                                            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                                        >
                                            <Send fontSize="small" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QnASection;
