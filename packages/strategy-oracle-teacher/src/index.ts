export {
  searchCanonicalCounterfactual,
  type TeacherCounterfactualState,
  type TeacherLegalTarget,
  type TeacherOutcomeSummary,
  type TeacherSearchReceipt,
  type TeacherSearchRequest,
} from "./teacher.js"
export {
  chooseDistilledStudentAction,
  compileLegalStudentPolicy,
  distillLegalStudent,
  projectTeacherSearchToLegalTraining,
  type CompiledLegalStudentPolicy,
  type DistilledLegalStudent,
  type LegalTrainingRecord,
  runDistilledActivations,
  runDistilledSoldierBrain,
  type StudentAction,
} from "./distill.js"
export {
  assertTeacherSourceClosure,
  deriveTeacherControllerManifest,
  emitTeacherFactoryPacket,
  emitTeacherSource,
  getTeacherControllerManifest,
  type TeacherControllerManifest,
  type TeacherFactoryRequest,
} from "./emit.js"
