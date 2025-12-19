/**
 * Extracts Mermaid code blocks from markdown content and converts them to textual descriptions
 */
export const extractMermaidBlocks = (content: string): { cleanContent: string; mermaidBlocks: string[] } => {
    const mermaidBlocks: string[] = [];
    let cleanContent = content;

    // Match ```mermaid ... ``` blocks
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;

    // Match raw "graph TD" or "graph LR" etc. blocks
    const rawGraphRegex = /^(graph\s+(?:TD|LR|TB|BT|RL)\s*\n(?:[^\n]+\n?)+)/gm;

    // Extract and convert fenced mermaid blocks
    cleanContent = cleanContent.replace(mermaidRegex, (match, diagram) => {
        const description = convertMermaidToText(diagram.trim());
        mermaidBlocks.push(description);
        return `\n**Fluxo do Processo:**\n${description}\n`;
    });

    // Extract and convert raw graph blocks
    cleanContent = cleanContent.replace(rawGraphRegex, (match) => {
        const description = convertMermaidToText(match.trim());
        if (!mermaidBlocks.includes(description)) {
            mermaidBlocks.push(description);
        }
        return `\n**Fluxo do Processo:**\n${description}\n`;
    });

    return { cleanContent, mermaidBlocks };
};

/**
 * Converts Mermaid diagram syntax to a textual description
 */
const convertMermaidToText = (diagram: string): string => {
    const lines = diagram.split('\n').filter(line => line.trim());
    const steps: string[] = [];
    const nodes: Map<string, string> = new Map();

    // First pass: extract node definitions (A[Label])
    for (const line of lines) {
        // Match node definitions like A[Text] or A{Text} or A(Text)
        const nodeMatches = line.matchAll(/([A-Z][A-Za-z0-9]*)\[([^\]]+)\]|([A-Z][A-Za-z0-9]*)\{([^}]+)\}|([A-Z][A-Za-z0-9]*)\(([^)]+)\)/g);
        for (const match of nodeMatches) {
            const id = match[1] || match[3] || match[5];
            const label = match[2] || match[4] || match[6];
            if (id && label) {
                // Clean up any markdown-like syntax in labels
                nodes.set(id, label.replace(/\*\*/g, ''));
            }
        }
    }

    // Second pass: extract connections and build flow description
    let stepNumber = 1;
    for (const line of lines) {
        if (line.startsWith('graph')) continue;

        // Match connections like A --> B or A -- Label --> B
        const connectionMatch = line.match(/([A-Z][A-Za-z0-9]*)\s*(?:--\s*([^>-]+)\s*)?-->?\s*([A-Z][A-Za-z0-9]*)/);

        if (connectionMatch) {
            const [, fromId, label, toId] = connectionMatch;
            const fromLabel = nodes.get(fromId) || fromId;
            const toLabel = nodes.get(toId) || toId;

            let stepDesc = `${stepNumber}. ${fromLabel}`;
            if (label && label.trim()) {
                stepDesc += ` → (${label.trim()})`;
            }
            stepDesc += ` → ${toLabel}`;

            steps.push(stepDesc);
            stepNumber++;
        }
    }

    if (steps.length === 0) {
        // If we couldn't parse it, just describe it generically
        return '- Fluxo de processo definido (consulte a versão web para visualização gráfica)';
    }

    return steps.join('\n');
};

/**
 * @deprecated - No longer needed since we're using text descriptions
 */
export const renderAllMermaidDiagrams = async (mermaidBlocks: string[]): Promise<string[]> => {
    // Return empty array since we're not rendering images anymore
    return [];
};

/**
 * @deprecated - No longer needed since we're using text descriptions  
 */
export const renderMermaidToImage = async (diagram: string, id: string = ''): Promise<string> => {
    return '';
};
