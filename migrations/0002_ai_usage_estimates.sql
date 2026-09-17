-- Basic Workers AI cost estimation for V0.
-- GLM-4.7-Flash current pricing basis (2026-09-17):
-- 5,500 neurons / 1M input tokens, 36,400 neurons / 1M output tokens.
-- Workers AI reference price: $0.011 / 1,000 neurons.

CREATE TRIGGER IF NOT EXISTS trg_ai_usage_estimate_after_insert
AFTER INSERT ON ai_usage
BEGIN
  UPDATE ai_usage
  SET estimated_neurons = CASE
        WHEN NEW.model = '@cf/zai-org/glm-4.7-flash'
             AND (NEW.input_tokens > 0 OR NEW.output_tokens > 0)
          THEN CAST(ROUND((NEW.input_tokens * 0.0055) + (NEW.output_tokens * 0.0364)) AS INTEGER)
        ELSE NEW.estimated_neurons
      END,
      estimated_cost_usd = CASE
        WHEN NEW.model = '@cf/zai-org/glm-4.7-flash'
             AND (NEW.input_tokens > 0 OR NEW.output_tokens > 0)
          THEN ROUND(((NEW.input_tokens * 0.0055) + (NEW.output_tokens * 0.0364)) * 0.000011, 8)
        ELSE ROUND(NEW.estimated_neurons * 0.000011, 8)
      END
  WHERE id = NEW.id;
END;
