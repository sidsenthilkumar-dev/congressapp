"""Synthetic fixtures test implementation only. They are not video accuracy evidence."""
import copy
import hashlib
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from train_models import FEATURES, VERSION, train, validate


def fixtures():
    rows=[]
    for group, split in enumerate(["train","train","train","validation","test","test"]):
        for label in ["acceptable","torso"]:
            for index in range(5):
                name=f"synthetic-{group}-{label}-{index}"
                rows.append(dict(clip_id=name,participant_id=f"synthetic-person-{group}",exercise_id="synthetic-exercise",view="side",family="upper",split=split,label=label,video_sha256=hashlib.sha256(name.encode()).hexdigest(),rights={"trainingAllowed":True,"reference":"SYNTHETIC SOFTWARE TEST FIXTURE; NOT HUMAN FOOTAGE"},version=VERSION,pose_model="@mediapipe/pose@0.5.1675469404/full",feature_names=FEATURES,quality={"usableFrames":10,"usableFraction":1},features=[(2 if label=="torso" else -2)+index*.1+group*.01]*len(FEATURES)))
    return rows


class TrainingTests(unittest.TestCase):
    def test_candidate_is_research_only_and_reports_held_out_coverage(self):
        model=train(fixtures())[0]
        self.assertEqual(model["deployment_status"],"research_only_not_loaded_by_app")
        self.assertEqual(model["people_per_split"],{"train":3,"validation":1,"test":2})
        self.assertEqual(model["held_out_test"]["clips_total"],20)
        self.assertIn("automatic_false_alarm_rate_on_usable_acceptable_clips",model["held_out_test"])
    def test_same_person_cannot_cross_splits(self):
        rows=fixtures();rows[-1]["participant_id"]=rows[0]["participant_id"]
        with self.assertRaisesRegex(ValueError,"leakage"):train(rows)
    def test_duplicate_video_cannot_cross_splits(self):
        rows=fixtures();rows[-1]["video_sha256"]=rows[0]["video_sha256"]
        with self.assertRaisesRegex(ValueError,"leakage"):train(rows)
    def test_code_license_does_not_substitute_for_video_permission(self):
        rows=fixtures();rows[0]["rights"]={"trainingAllowed":False,"reference":"Code only"}
        with self.assertRaisesRegex(ValueError,"permission"):train(rows)
    def test_unusable_pose_remains_in_evaluation_denominator(self):
        rows=fixtures();row=copy.deepcopy(rows[-1]);row["clip_id"]="synthetic-occluded";row["features"]=None;rows.append(row)
        report=train(rows)[0]["held_out_test"]
        self.assertEqual(report["clips_total"],21);self.assertEqual(report["clips_excluded_for_pose"],1)
    def test_test_people_never_change_fitted_preprocessing(self):
        rows=fixtures();original=train(rows)[0]
        for row in rows:
            if row["split"]=="test":row["features"]=[value+1000 for value in row["features"]]
        changed=train(rows)[0]
        self.assertEqual(original["mean"],changed["mean"]);self.assertEqual(original["coefficients"],changed["coefficients"])
    def test_incompatible_extractors_and_nonfinite_values_fail(self):
        rows=fixtures();rows[0]["version"]="other"
        with self.assertRaisesRegex(ValueError,"incompatible"):validate(rows)
        rows=fixtures();rows[0]["features"][0]=float("nan")
        with self.assertRaisesRegex(ValueError,"Non-finite"):validate(rows)
    def test_tiny_cohorts_and_empty_inputs_cannot_train(self):
        with self.assertRaisesRegex(ValueError,"No labelled"):train([])
        rows=[row for row in fixtures() if row["participant_id"]!="synthetic-person-5"]
        with self.assertRaisesRegex(ValueError,"insufficient independent"):train(rows)


if __name__=="__main__":unittest.main()
