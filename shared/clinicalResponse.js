export function mergeClinicalWithFallback(aiResponse, fallback) {
  const investigation = aiResponse?.investigationPlan || { immediate: [], complementary: [], specialAttention: [] };
  const conduct = aiResponse?.conduct || { immediateActions: [], monitoring: [], legalNotice: '' };
  const hypotheses = Array.isArray(aiResponse?.hypotheses) ? aiResponse.hypotheses.slice(0, 3) : [];

  const mappedHypotheses = hypotheses.length
    ? hypotheses.map((item) => ({
        name: item.name || 'Hipótese não informada',
        probability: item.probability === 'Alta' ? 'Alta' : item.probability === 'Média' ? 'Moderada' : 'Baixa',
        treatment: `${conduct.legalNotice || 'Conduta educacional baseada em estabilização, monitorização e protocolos institucionais.'} Ações sugeridas: ${(conduct.immediateActions || []).join(', ')}`,
        explanation: `${item.justification || 'Sem justificativa estruturada.'} ${item.physiopathology || ''}`.trim(),
        differentials: item.differentials || [],
        recommendedExams: item.exams || [],
        redFlags: investigation.specialAttention || [],
        score: typeof item.confidenceScore === 'number' ? Math.max(0, Math.min(item.confidenceScore, 100)) : 70,
      }))
    : fallback.hypotheses;

  return {
    hypotheses: mappedHypotheses,
    emergencyWarning:
      aiResponse?.triageLevel === 'Emergência'
        ? '🚨 Caso potencialmente crítico em contexto educacional. Encaminhar imediatamente para avaliação presencial/emergência.'
        : fallback.emergencyWarning,
    triageLevel:
      aiResponse?.triageLevel === 'Urgência'
        ? 'Urgente'
        : aiResponse?.triageLevel === 'Emergência'
          ? 'Emergência'
          : aiResponse?.triageLevel === 'Eletivo'
            ? 'Ambulatorial'
            : fallback.triageLevel,
    triageReason: aiResponse?.triageReason || fallback.triageReason,
    suggestedExams: [
      ...new Set([
        ...(investigation.immediate || []),
        ...(investigation.complementary || []),
        ...(investigation.specialAttention || []),
        ...(fallback.suggestedExams || []),
      ]),
    ].slice(0, 8),
    immediateActions: [...new Set([...(conduct.immediateActions || []), ...(conduct.monitoring || []), ...(fallback.immediateActions || [])])].slice(0, 6),
    clinicalSummary: `${aiResponse?.educationalWarning || fallback.clinicalSummary}\nResumo de segurança: ${fallback.clinicalSummary}`.slice(0, 1400),
  };
}
