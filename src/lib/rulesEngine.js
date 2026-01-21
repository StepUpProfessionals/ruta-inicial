function evalCond(cond, answers) {
  // cond examples:
  // { eq: ["q3_blocker","pronunciation"] }
  // { any: [cond, cond] }
  // { all: [cond, cond] }

  if (cond.eq) {
    const [qid, expected] = cond.eq;
    return answers[qid] === expected;
  }
  if (cond.any) return cond.any.some(c => evalCond(c, answers));
  if (cond.all) return cond.all.every(c => evalCond(c, answers));
  return false;
}

export function pickRoute(rulesDoc, answers) {
  const rules = [...(rulesDoc.rules || [])];

  // Sort by priority asc (lower first), then keep original order for ties
  rules.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  for (const r of rules) {
    if (!r.when) continue;
    if (evalCond(r.when, answers)) return r.route;
  }
  return rulesDoc.fallback || "pronunciation_foundations";
}
