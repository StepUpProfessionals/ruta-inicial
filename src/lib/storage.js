const KEY = "stepup_codex1_answers_v1";

export function loadAnswers() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAnswers(answers) {
  localStorage.setItem(KEY, JSON.stringify(answers));
}

export function clearAnswers() {
  localStorage.removeItem(KEY);
}
