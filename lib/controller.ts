// External Controller Implementation
// Based on patent FIG. 4 operational flow

import type {
  BSetFile,
  BSetItem,
  TaxonomyNode,
  ConstraintObject,
  AuthorizedContext,
  Sticky,
} from '@/types/bset';

/**
 * Computes cosine similarity between two text strings using TF-IDF
 * (Simplified implementation - in production, use a proper NLP library)
 */
function computeCosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const allWords = Array.from(new Set([...words1, ...words2]));
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Step 1: Determine target analytical node from query
 * Implements node determination using TF-IDF similarity (patent §220-227)
 */
export function determineTargetNode(
  query: string,
  taxonomy: TaxonomyNode[],
  threshold: number = 0.15
): TaxonomyNode | null {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !isStopWord(term));
  
  if (queryTerms.length === 0) {
    // If no valid terms, return root node as fallback
    return taxonomy.find(n => !n.parent_id) || taxonomy[0] || null;
  }

  let bestNode: TaxonomyNode | null = null;
  let bestScore = threshold;

  for (const node of taxonomy) {
    const nodeText = `${node.title}`.toLowerCase();
    const score = computeCosineSimilarity(query, nodeText);
    
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  }

  // If no node found, use root node as fallback
  if (!bestNode) {
    bestNode = taxonomy.find(n => !n.parent_id) || taxonomy[0] || null;
  }

  return bestNode;
}

/**
 * Helper: Check if word is a stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'can', 'what', 'which', 'who',
    'when', 'where', 'why', 'how'
  ]);
  return stopWords.has(word.toLowerCase());
}

/**
 * Step 2: Compute analytical path from root to target node
 * Implements path computation (patent §230)
 */
export function computeAnalyticalPath(
  targetNode: TaxonomyNode,
  taxonomy: TaxonomyNode[]
): string[] {
  const path: string[] = [];
  let currentNode: TaxonomyNode | null = targetNode;

  // Build path from target back to root
  while (currentNode) {
    path.unshift(currentNode.id);
    
    if (!currentNode.parent_id) break;
    
    currentNode = taxonomy.find(n => n.id === currentNode!.parent_id) || null;
  }

  return path;
}

/**
 * Step 3: Retrieve reasoning objects using path-based matching
 * Implements deterministic retrieval with prefix matching (patent §240)
 * 
 * IMPORTANT: This retrieves ALL items where the analytical path is a PREFIX
 * of the item's taxonomy_path. This means if the analytical path is [A, B],
 * we retrieve items with paths like [A, B], [A, B, C], [A, B, C, D], etc.
 * This ensures we get all cases under the target node and its descendants.
 */
export function retrieveReasoningObjects(
  analyticalPath: string[],
  items: BSetItem[]
): BSetItem[] {
  const exactMatches: BSetItem[] = [];
  const inheritedMatches: BSetItem[] = [];

  for (const item of items) {
    const itemPath = item.taxonomy_path;
    
    // Check for exact match (item path equals analytical path)
    if (pathsMatch(itemPath, analyticalPath)) {
      exactMatches.push(item);
      continue;
    }
    
    // Check if analytical path is a PREFIX of item path (item is descendant)
    // This is the key fix: we want items UNDER our target node
    if (isAnalyticalPathPrefixOfItem(analyticalPath, itemPath)) {
      inheritedMatches.push(item);
    }
  }

  // Deterministic ordering: exact matches first, then inherited
  return [...exactMatches, ...inheritedMatches];
}

/**
 * Check if two paths match exactly
 */
function pathsMatch(path1: string[], path2: string[]): boolean {
  if (path1.length !== path2.length) return false;
  return path1.every((id, idx) => id === path2[idx]);
}

/**
 * Check if analytical path is a prefix of item path
 * This means: analyticalPath = [A, B] matches itemPath = [A, B, C, D]
 * We want to retrieve items that are UNDER our target node
 */
function isAnalyticalPathPrefixOfItem(analyticalPath: string[], itemPath: string[]): boolean {
  if (analyticalPath.length > itemPath.length) return false;
  return analyticalPath.every((id, idx) => id === itemPath[idx]);
}

/**
 * Flatten the taxonomy tree (from _meta.taxonomy) into a flat array of TaxonomyNode,
 * adding parent_id so computeAnalyticalPath can walk up the tree.
 */
export function flattenTaxonomyTree(
  nodes: Array<{ id: string; title: string; children?: Array<any> }>,
  parentId: string | null = null
): TaxonomyNode[] {
  const result: TaxonomyNode[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, title: node.title, parent_id: parentId });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTaxonomyTree(node.children, node.id));
    }
  }
  return result;
}

/**
 * Retrieve sticky notes using path-based prefix matching.
 * Returns all stickies whose path starts with the analytical path.
 */
export function retrieveStickies(
  analyticalPath: string[],
  stickies: Sticky[]
): Sticky[] {
  const exact: Sticky[] = [];
  const descendants: Sticky[] = [];

  for (const sticky of stickies) {
    if (pathsMatch(sticky.path, analyticalPath)) {
      exact.push(sticky);
    } else if (isAnalyticalPathPrefixOfItem(analyticalPath, sticky.path)) {
      descendants.push(sticky);
    }
  }

  return [...exact, ...descendants];
}

/**
 * Step 4: Retrieve constraint objects using path-based matching
 * Implements constraint retrieval (patent §235)
 */
export function retrieveConstraintObjects(
  analyticalPath: string[],
  bsetFile: BSetFile
): ConstraintObject[] {
  // Parse constraints from items' notes field
  // The patent shows constraints can be embedded in notes with markers like:
  // "TEST/STANDARD(◼):", "ELEMENT/FACTOR (1):", "MACRO-FORK(a):"
  
  const constraints: ConstraintObject[] = [];
  
  for (const item of bsetFile.items) {
    if (!item.notes) continue;
    
    const itemPath = item.taxonomy_path;
    
    // Only process items in our analytical path or descendants
    if (!pathsMatch(itemPath, analyticalPath) && !isAnalyticalPathPrefixOfItem(analyticalPath, itemPath)) {
      continue;
    }
    
    // Extract constraints from notes
    const noteConstraints = parseNotesForConstraints(item.notes, itemPath);
    constraints.push(...noteConstraints);
  }
  
  return constraints;
}

/**
 * Parse notes field to extract constraint objects
 */
function parseNotesForConstraints(notes: string, path: string[]): ConstraintObject[] {
  const constraints: ConstraintObject[] = [];
  
  // Match patterns like "TEST/STANDARD(◼):", "ELEMENT/FACTOR (1):", etc.
  const patterns = [
    { regex: /TEST\/STANDARD\(◼\):\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, type: 'test/standard' as const },
    { regex: /ELEMENT\/FACTOR\s*\((\d+)\):\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, type: 'element/factor' as const },
    { regex: /MACRO-FORK\(([a-z])\):\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, type: 'macro-fork' as const },
    { regex: /GENERAL NOTE\(◼\):\s*(.+?)(?=\n\n|\n[A-Z]|$)/gs, type: 'general' as const },
  ];
  
  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(notes)) !== null) {
      const content = type === 'element/factor' ? match[2] : match[1];
      constraints.push({
        id: `constraint_${Math.random().toString(36).substr(2, 9)}`,
        path,
        note_type: type,
        content: content.trim(),
        is_test_standard: type === 'test/standard',
        is_element_factor: type === 'element/factor',
        is_macro_fork: type === 'macro-fork',
      });
    }
  }
  
  return constraints;
}

/**
 * Step 5: Assemble authorized reasoning context
 * Implements context assembly (patent §250)
 */
export function assembleAuthorizedContext(
  analyticalPath: string[],
  targetNode: TaxonomyNode,
  reasoningObjects: BSetItem[],
  constraintObjects: ConstraintObject[],
  stickyNotes: Sticky[],
  taxonomy: TaxonomyNode[]
): AuthorizedContext {
  return {
    reasoning_objects: reasoningObjects,
    constraint_objects: constraintObjects,
    analytical_path: analyticalPath,
    target_node: targetNode,
    sticky_notes: stickyNotes,
    taxonomy,
  };
}

/**
 * Step 6: Generate structured instructions for LLM
 * Implements instruction generation (patent §255)
 */
export function generateStructuredInstructions(
  context: AuthorizedContext,
  query: string
): string {
  const { target_node, reasoning_objects, constraint_objects, sticky_notes, taxonomy } = context;

  // Build a quick id→title lookup from the taxonomy
  const nodeTitle: Record<string, string> = {};
  for (const n of taxonomy) {
    nodeTitle[n.id] = n.title;
  }

  let instructions = `You are goldilex, a constrained reasoning assistant. You ONLY use information from the provided authorized context - you never add outside knowledge or make things up.\n\n`;
  instructions += `PERSONALITY:\n`;
  instructions += `- Always refer to yourself as "goldilex" or use "I" statements (e.g., "I found..." "I analyzed...")\n`;
  instructions += `- Be clear, professional, and helpful\n`;
  instructions += `- Be confident about what's in your knowledge base, but never invent information\n\n`;
  instructions += `ANALYTICAL DOMAIN: ${target_node.title}\n`;
  instructions += `USER QUERY: ${query}\n\n`;
  instructions += `CRITICAL CONSTRAINTS (NEVER VIOLATE THESE):\n`;
  instructions += `1. I MUST ONLY use information explicitly provided in the authorized context below.\n`;
  instructions += `2. I MUST NOT introduce outside facts, cases, statutes, or authorities not listed here.\n`;
  instructions += `3. If the authorized context doesn't contain enough information to fully answer the query, I will say so clearly.\n`;
  instructions += `4. All notes should be understood literally as the user's own recorded content.\n\n`;

  // Add test/standard constraints (from legacy items)
  const tests = constraint_objects.filter(c => c.is_test_standard);
  if (tests.length > 0) {
    instructions += `REQUIRED ANALYTICAL FRAMEWORK:\n`;
    tests.forEach((test, idx) => {
      instructions += `Test ${idx + 1}: ${test.content}\n`;
    });
    instructions += `\n`;
  }

  // Add element/factor constraints (from legacy items)
  const elements = constraint_objects.filter(c => c.is_element_factor);
  if (elements.length > 0) {
    instructions += `REQUIRED ELEMENTS TO ADDRESS:\n`;
    elements.forEach((elem, idx) => {
      instructions += `${idx + 1}. ${elem.content}\n`;
    });
    instructions += `\n`;
  }

  // Add authorized cases/authorities (legacy items)
  if (reasoning_objects.length > 0) {
    instructions += `AUTHORIZED CASES AND AUTHORITIES (you may ONLY cite from this list - ${reasoning_objects.length} total):\n\n`;
    reasoning_objects.forEach((obj, idx) => {
      instructions += `[${idx + 1}] ${obj.name}\n`;
      if (obj.type) instructions += `    Type: ${obj.type}\n`;
      if (obj.citation) instructions += `    Citation: ${obj.citation}\n`;
      if (obj.rule_of_law) instructions += `    Rule of Law: ${obj.rule_of_law}\n`;
      if (obj.holding) instructions += `    Holding: ${obj.holding}\n`;
      if (obj.facts) instructions += `    Facts: ${obj.facts}\n`;
      if (obj.question) instructions += `    Question: ${obj.question}\n`;
      if (obj.notes && obj.notes.trim()) instructions += `    User Notes: ${obj.notes}\n`;
      instructions += `\n`;
    });
  }

  // Add sticky notes organized by type
  if (sticky_notes.length > 0) {
    instructions += `AUTHORIZED NOTES FROM BRIEFSET (${sticky_notes.length} total - use ONLY these):\n\n`;

    const noteTypeOrder: Array<Sticky['note_type']> = [
      'test/standard',
      'element/factor',
      'macro-fork',
      'micro-fork',
      'general note',
      'footnote',
    ];
    const typeLabels: Record<Sticky['note_type'], string> = {
      'test/standard': 'TESTS & STANDARDS (Analytical Frameworks)',
      'element/factor': 'ELEMENTS & FACTORS',
      'macro-fork': 'MACRO-FORKS (Major Alternative Paths)',
      'micro-fork': 'MICRO-FORKS (Minor Alternative Paths)',
      'general note': 'GENERAL NOTES',
      'footnote': 'FOOTNOTES',
    };

    for (const noteType of noteTypeOrder) {
      const group = sticky_notes.filter(s => s.note_type === noteType);
      if (group.length === 0) continue;

      instructions += `--- ${typeLabels[noteType]} ---\n`;
      for (const sticky of group) {
        const leafId = sticky.path[sticky.path.length - 1];
        const heading = nodeTitle[leafId] || leafId;
        const text = sticky.content.map(c => c.text).join('');
        instructions += `[Under "${heading}"]: ${text}\n`;
      }
      instructions += `\n`;
    }
  }

  instructions += `\nProvide your answer addressing the query using ONLY the authorized context listed above.\n`;

  return instructions;
}

/**
 * Main controller orchestration
 * Implements full operational flow (patent FIG. 4A-4B)
 */
export class ExternalController {
  constructor(private bsetFile: BSetFile) {}
  
  async processQuery(query: string, targetNodeId?: string): Promise<AuthorizedContext> {
    // Use full flattened taxonomy (includes sub-nodes) for better node matching
    const taxonomy = this.bsetFile._meta.taxonomy
      ? flattenTaxonomyTree(this.bsetFile._meta.taxonomy)
      : this.bsetFile._meta.headings;

    // Step 1: Determine target node (§220-227)
    let targetNode: TaxonomyNode | null;

    if (targetNodeId) {
      targetNode = taxonomy.find(n => n.id === targetNodeId) || null;
    } else {
      targetNode = determineTargetNode(query, taxonomy);
    }

    if (!targetNode) {
      throw new Error('Could not determine target analytical node from query');
    }

    // Step 2: Compute analytical path (§230)
    const analyticalPath = computeAnalyticalPath(targetNode, taxonomy);

    // Step 3 & 4: Retrieve reasoning objects, constraint objects, and sticky notes
    const reasoningObjects = retrieveReasoningObjects(analyticalPath, this.bsetFile.items);
    const constraintObjects = retrieveConstraintObjects(analyticalPath, this.bsetFile);
    const stickyNotes = retrieveStickies(analyticalPath, this.bsetFile._meta.stickies ?? []);

    // Step 5: Assemble context (§250)
    const context = assembleAuthorizedContext(
      analyticalPath,
      targetNode,
      reasoningObjects,
      constraintObjects,
      stickyNotes,
      taxonomy
    );

    return context;
  }
}
