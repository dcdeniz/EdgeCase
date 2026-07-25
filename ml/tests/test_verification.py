from preseed_ml.verification import verify_generated_reports


def test_generated_reports_preserve_reviewed_cross_platform_contract() -> None:
    summary = verify_generated_reports()
    assert summary["visemPromotionGatesPassed"] is False
    assert summary["uciSelectedModel"] == "prevalence_threshold_forest"
    assert summary["uciRuntimeEligible"] is False
    assert summary["crossPlatformMetricToleranceApplied"] is True
