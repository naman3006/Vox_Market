/**
 * Parses a voice transcript into structured filter updates.
 *
 * Supported patterns:
 * - "Category [Name]" -> { category: [matching_id] }
 * - "Price under [Amount]", "Under [Amount]", "Less than [Amount]" -> { maxPrice: [amount] }
 * - "Price over [Amount]", "Over [Amount]", "More than [Amount]" -> { minPrice: [amount] }
 * - "Sort by [Field]" -> { sortBy: [field] }
 * - "Clear filters", "Reset" -> { ...defaults }
 *
 * @param {string} transcript - The spoken text.
 * @param {Array} categories - List of available categories to match against.
 * @returns {Object|null} - An object with filter updates, or null if no command was matched (implying search term).
 */
export const parseVoiceCommand = (transcript, categories = []) => {
    if (!transcript) return null;
    const lowerTranscript = transcript.toLowerCase();
    const updates = {};
    let isCommand = false;

    // 1. Check for "Clear filters"
    if (lowerTranscript.includes("clear filters") || lowerTranscript.includes("reset filters")) {
        return {
            category: "",
            search: "",
            minPrice: "",
            maxPrice: "",
            sortBy: "createdAt",
            sortOrder: "desc",
            page: 1
        };
    }

    // 2. Category matching
    // Looks for "category [name]" or just checks if the transcript *is* a category name
    const categoryMatch = categories.find(cat =>
        lowerTranscript.includes(cat.name.toLowerCase())
    );

    if (categoryMatch && lowerTranscript.includes("category")) {
        updates.category = categoryMatch._id;
        isCommand = true;
    }

    // 3. Price parsing
    // "under 500", "less than 500", "max 500"
    const underMatch = lowerTranscript.match(/(?:under|less than|below|max)\s+(\d+)/);
    if (underMatch) {
        updates.maxPrice = underMatch[1];
        isCommand = true;
    }

    // "over 500", "more than 500", "min 500"
    const overMatch = lowerTranscript.match(/(?:over|more than|above|min)\s+(\d+)/);
    if (overMatch) {
        updates.minPrice = overMatch[1];
        isCommand = true;
    }

    // 4. Sort parsing
    if (lowerTranscript.includes("sort by")) {
        if (lowerTranscript.includes("price")) {
            updates.sortBy = "price";
            isCommand = true;
        } else if (lowerTranscript.includes("newest") || lowerTranscript.includes("latest")) {
            updates.sortBy = "createdAt";
            isCommand = true;
        } else if (lowerTranscript.includes("rating")) {
            updates.sortBy = "rating";
            isCommand = true;
        } else if (lowerTranscript.includes("popularity")) {
            updates.sortBy = "soldCount";
            isCommand = true;
        }
    }

    // If we found specific commands, return the updates object.
    // Otherwise, treat the entire transcript as a search term.
    if (isCommand) {
        return updates;
    }

    // If no specific command syntax is found, return { search: transcript }
    // But we want to preserve other filters if it's just a search, so we return checking logic in the component
    // Actually, let's simplify: return { search: transcript } as the default fallback
    return { search: transcript };
};
