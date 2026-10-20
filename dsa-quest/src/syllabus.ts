/**
 * Official syllabus text (DTU Data Structures image + CS205 DAA, Sem 3 Syllabus.pdf p.3),
 * each topic mapped to the level(s) that teach it. A unit test checks every id exists.
 */
export interface SylTopic {
  topic: string;
  levels: string[];
}
export interface SylUnit {
  course: 'DS' | 'DAA';
  unit: number;
  title: string;
  hours: number;
  topics: SylTopic[];
}

export const SYLLABUS: SylUnit[] = [
  {
    course: 'DS', unit: 1, title: 'Introduction · Arrays & Strings · Stacks & Queues', hours: 8,
    topics: [
      { topic: 'Introduction to Algorithmic', levels: ['L01'] },
      { topic: 'Complexity — Time-Space Trade-off', levels: ['L02', 'L03'] },
      { topic: 'Abstract data types: design, implementation and applications', levels: ['L01'] },
      { topic: 'Introduction to List data structure', levels: ['L01', 'L05'] },
      { topic: 'Representation of Arrays in Memory: 1-D, 2-D, multidimensional', levels: ['L04'] },
      { topic: 'Accessing elements of array', levels: ['L04'] },
      { topic: 'Array operations: Insertion, Deletion and Searching', levels: ['L05', 'L06'] },
      { topic: 'Sorting elements of arrays', levels: ['L07'] },
      { topic: 'Strings and String Operations', levels: ['L08'] },
      { topic: 'Introduction to Stacks and Queues; operations', levels: ['L09', 'L12'] },
      { topic: 'Array representation of Stacks', levels: ['L09'] },
      { topic: 'Applications of Stacks: recursion', levels: ['L10'] },
      { topic: 'Polish expressions and their compilation; infix → prefix and postfix', levels: ['L11'] },
      { topic: 'Operations, representations and applications of Queues', levels: ['L12'] },
      { topic: 'Priority queues', levels: ['L13', 'L29'] },
    ],
  },
  {
    course: 'DS', unit: 2, title: 'Linked Lists', hours: 6,
    topics: [
      { topic: 'Singly linked lists; representation', levels: ['L14'] },
      { topic: 'Operations: traversing, insertion, deletion, searching', levels: ['L14'] },
      { topic: 'Applications of linked lists', levels: ['L17'] },
      { topic: 'Circular linked list', levels: ['L15'] },
      { topic: 'Doubly linked list and applications', levels: ['L16'] },
      { topic: 'Stacks and Queues as linked lists', levels: ['L17'] },
    ],
  },
  {
    course: 'DS', unit: 3, title: 'Trees', hours: 8,
    topics: [
      { topic: 'Basic terminology', levels: ['L23'] },
      { topic: 'Binary trees and their representation', levels: ['L23'] },
      { topic: 'Binary search trees; operations (traversal, searching, insertion, deletion) — text partly hidden in the image, standard set covered', levels: ['L24', 'L25', 'L26'] },
      { topic: 'Applications of binary search trees', levels: ['L26'] },
      { topic: 'Complete binary trees, extended binary trees', levels: ['L27'] },
      { topic: 'General trees', levels: ['L27'] },
      { topic: 'AVL trees', levels: ['L30'] },
      { topic: 'Threaded trees', levels: ['L28'] },
      { topic: 'B-trees', levels: ['L31'] },
    ],
  },
  {
    course: 'DS', unit: 4, title: 'Searching and Sorting', hours: 7,
    topics: [
      { topic: 'Linear search, binary search, interpolation search', levels: ['L06'] },
      { topic: 'Insertion sort', levels: ['L07'] },
      { topic: 'Quick sort', levels: ['L21'] },
      { topic: 'Merge sort', levels: ['L20'] },
      { topic: 'Heap sort', levels: ['L29'] },
      { topic: 'Sorting on different keys', levels: ['L35'] },
      { topic: 'External sorting', levels: ['L36'] },
    ],
  },
  {
    course: 'DS', unit: 5, title: 'Graphs', hours: 7,
    topics: [
      { topic: 'Terminology and representations; graphs & multigraphs; directed graphs', levels: ['L38'] },
      { topic: 'Traversal of graphs', levels: ['L39'] },
      { topic: 'Spanning trees', levels: ['L42'] },
      { topic: 'Shortest path', levels: ['L43', 'L44', 'L51'] },
      { topic: 'Transitive closure', levels: ['L45'] },
      { topic: 'Activity networks, topological sort and critical paths', levels: ['L46'] },
    ],
  },
  {
    course: 'DS', unit: 6, title: 'File Structure', hours: 6,
    topics: [
      { topic: 'File organization', levels: ['L34'] },
      { topic: 'Indexing & hashing', levels: ['L34', 'L32'] },
      { topic: 'Hash functions', levels: ['L32'] },
      { topic: 'Collision resolution techniques', levels: ['L33'] },
    ],
  },
  {
    course: 'DAA', unit: 1, title: 'Introduction', hours: 6,
    topics: [
      { topic: 'Concept of algorithmic efficiency; run-time analysis', levels: ['L01', 'L02'] },
      { topic: 'Asymptotic notations; growth of functions', levels: ['L03'] },
      { topic: "Master's theorem", levels: ['L19'] },
    ],
  },
  {
    course: 'DAA', unit: 2, title: 'Searching and Sorting (Divide & Conquer)', hours: 8,
    topics: [
      { topic: 'Structure of divide-and-conquer algorithms', levels: ['L20'] },
      { topic: 'Binary search', levels: ['L06'] },
      { topic: 'Quick sort', levels: ['L21'] },
      { topic: 'Strassen matrix multiplication', levels: ['L22'] },
      { topic: 'Merge sort, heap sort', levels: ['L20', 'L29'] },
      { topic: 'Analysis of divide-and-conquer run-time recurrence relations', levels: ['L18', 'L19'] },
      { topic: 'Graph theory: connected components, cut vertex, bridge', levels: ['L39', 'L40'] },
    ],
  },
  {
    course: 'DAA', unit: 3, title: 'Greedy Method', hours: 10,
    topics: [
      { topic: 'Overview of the greedy paradigm', levels: ['L47'] },
      { topic: 'Minimum cost spanning tree: Kruskal, Prim', levels: ['L41', 'L42'] },
      { topic: 'Knapsack problem (fractional)', levels: ['L47'] },
      { topic: "Dijkstra's and Bellman-Ford single-source shortest paths", levels: ['L43', 'L44'] },
      { topic: 'Huffman coding', levels: ['L49'] },
      { topic: 'Activity selection problem', levels: ['L48'] },
    ],
  },
  {
    course: 'DAA', unit: 4, title: 'Dynamic Programming & Backtracking', hours: 10,
    topics: [
      { topic: 'Principles of dynamic programming; rod cutting', levels: ['L50'] },
      { topic: 'Floyd-Warshall all-pairs shortest paths', levels: ['L51'] },
      { topic: 'Matrix (chain) multiplication', levels: ['L52'] },
      { topic: 'Travelling salesman problem', levels: ['L56'] },
      { topic: 'Longest common subsequence', levels: ['L53'] },
      { topic: 'Edit distance', levels: ['L54'] },
      { topic: 'Backtracking: overview, 8-queen problem', levels: ['L57'] },
      { topic: 'Knapsack problem (0/1 — DP and backtracking)', levels: ['L55', 'L58'] },
    ],
  },
  {
    course: 'DAA', unit: 5, title: 'Branch and Bound', hours: 8,
    topics: [
      { topic: 'LC searching, bounding', levels: ['L59'] },
      { topic: 'FIFO branch and bound', levels: ['L59'] },
      { topic: 'LC branch and bound: 0/1 knapsack', levels: ['L60'] },
    ],
  },
  {
    course: 'DAA', unit: 6, title: 'Computational Complexity', hours: 6,
    topics: [
      { topic: 'Complexity measures; polynomial vs non-polynomial time', levels: ['L61'] },
      { topic: 'NP-hard and NP-complete classes', levels: ['L61'] },
      { topic: 'Examples: circuit satisfiability, vertex cover, subset sum', levels: ['L62'] },
    ],
  },
];
