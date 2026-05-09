import { mockAssets } from './src/data/mockAssets.ts';
import { mockMentors } from './src/data/mockKnowledge.ts';
import { processAssets } from './src/logic/scoringEngine.ts';
import { allKnowledgeRules } from './src/data/knowledgeRules.ts';
import { getRelevantKnowledgeRules } from './src/logic/knowledgeMatcher.ts';

const processed = processAssets(mockAssets, mockMentors);
const vwce = processed.find(a => a.ticker === 'VWCE');
const nvda = processed.find(a => a.ticker === 'NVDA');
const tsla = processed.find(a => a.ticker === 'TSLA');

console.log("---- VWCE ----");
getRelevantKnowledgeRules(vwce, allKnowledgeRules).forEach(r => console.log(`${r.rule.mentorName} | ${r.rule.category} | ${r.rule.rule} -> ${r.matchReason}`));

console.log("\n---- NVDA ----");
getRelevantKnowledgeRules(nvda, allKnowledgeRules).forEach(r => console.log(`${r.rule.mentorName} | ${r.rule.category} | ${r.rule.rule} -> ${r.matchReason}`));

console.log("\n---- TSLA ----");
getRelevantKnowledgeRules(tsla, allKnowledgeRules).forEach(r => console.log(`${r.rule.mentorName} | ${r.rule.category} | ${r.rule.rule} -> ${r.matchReason}`));
