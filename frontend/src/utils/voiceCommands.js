export const voiceCommands = [
    // Navigation Commands
    {
        pattern: /(go to|open|show|visit)\s+(home|homepage)/i,
        action: (navigate) => navigate('/'),
        feedback: 'Going Home',
    },
    {
        pattern: /(go to|open|show|visit)\s+(cart|basket|shopping bag)/i,
        action: (navigate) => navigate('/cart'),
        feedback: 'Opening Cart',
    },
    {
        pattern: /(go to|open|show|visit)\s+(wishlist|favorites)/i,
        action: (navigate) => navigate('/wishlist'),
        feedback: 'Opening Wishlist',
    },
    {
        pattern: /(go to|open|show|visit)\s+(orders|my orders|order history)/i,
        action: (navigate) => navigate('/orders'), // Assuming /orders is the route
        feedback: 'Opening Orders',
    },
    {
        pattern: /(go to|open|show|visit)\s+(profile|account|my account)/i,
        action: (navigate) => navigate('/profile'),
        feedback: 'Opening Profile',
    },
    {
        pattern: /(go to|open|show)\s+(login|sign in)/i,
        action: (navigate) => navigate('/login'),
        feedback: 'Opening Login',
    },
    {
        pattern: /(go to|open|show)\s+(register|signup|sign up)/i,
        action: (navigate) => navigate('/register'),
        feedback: 'Opening Registration',
    },
    {
        pattern: /(go to|open|show)\s+(dashboard|admin dashboard)/i,
        action: (navigate) => navigate('/admin/dashboard'),
        feedback: 'Opening Dashboard',
    },

    // Advanced Commands

    // 1. Theme Control
    {
        pattern: /(switch to|turn on|enable|toggle)\s+(dark mode|light mode|theme)/i,
        action: (_nav, _txt, { toggleDarkMode }) => {
            if (toggleDarkMode) {
                toggleDarkMode();
                return 'Toggling Theme';
            }
            return 'Theme control unavailable';
        },
        feedback: 'Toggling Theme',
    },

    // 2. Checkout & Buying
    {
        pattern: /(go to|open)\s+(checkout|payment)/i,
        action: (navigate) => navigate('/checkout'),
        feedback: 'Proceeding to Checkout',
    },
    {
        pattern: /(buy now|place order)/i,
        action: (navigate) => navigate('/checkout'), // Could be direct buy logic if implemented
        feedback: 'Taking you to checkout',
    },

    // 3. Help & Assistance
    {
        pattern: /(help|what can i do|commands|what can i say)/i,
        action: () => {
            // In a real app, this could open a modal or show a toast
            // For now, the feedback will list options
            return 'Try "open Cart", "Search for shoes", or "Switch Theme"';
        },
        feedback: 'Showing Help',
    },

    // 4. Order Tracking
    {
        pattern: /(track|where is)\s+(my order|order)/i,
        action: (navigate) => navigate('/orders'),
        feedback: 'Opening Order Tracking',
    },
    {
        pattern: /(contact|support|customer service)/i,
        action: () => window.location.href = 'mailto:support@eshop.com',
        feedback: 'Opening Email Support',
    },


    // Page Actions
    {
        pattern: /(scroll|go)\s+down/i,
        action: () => window.scrollBy({ top: 500, behavior: 'smooth' }),
        feedback: 'Scrolling down',
    },
    {
        pattern: /(scroll|go)\s+up/i,
        action: () => window.scrollBy({ top: -500, behavior: 'smooth' }),
        feedback: 'Scrolling up',
    },
    {
        pattern: /(go|navigate)\s+back/i,
        action: (navigate) => navigate(-1),
        feedback: 'Going back',
    },
    {
        pattern: /(scroll|go)\s+to\s+(top|bottom)/i,
        action: (_update, transcript) => {
            if (transcript.includes('bottom')) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                return 'Scrolling to bottom';
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return 'Scrolling to top';
            }
        },
        feedback: (transcript) => transcript.includes('bottom') ? 'Scrolling to bottom' : 'Scrolling to top',
    }
];

export const processVoiceCommand = (transcript, navigate, extraContext = {}) => {
    const lowerTranscript = transcript.toLowerCase().trim();

    for (const cmd of voiceCommands) {
        if (cmd.pattern.test(lowerTranscript)) {
            // Pass extraContext (e.g. toggleDarkMode) to action
            const result = cmd.action(navigate, lowerTranscript, extraContext);

            // If action returns string, use it as feedback, else use static feedback
            const feedbackMsg = typeof result === 'string' ? result :
                (typeof cmd.feedback === 'function' ? cmd.feedback(lowerTranscript) : cmd.feedback);

            return { matched: true, feedback: feedbackMsg };
        }
    }

    // Default: Search
    // If it starts with "search for", strip it
    const searchQuery = lowerTranscript.replace(/^(search for|find|show me)\s+/, '');
    if (searchQuery.length > 2) {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
        return { matched: true, feedback: `Searching for "${searchQuery}"` };
    }

    return { matched: false, feedback: null };
};
