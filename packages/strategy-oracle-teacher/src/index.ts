export {
  searchCanonicalCounterfactual,
  type TeacherCounterfactualState,
  type TeacherSearchReceipt,
  type TeacherSearchRequest,
} from "./teacher.js"
export {
  chooseDistilledStudentAction,
  compileLegalStudentPolicy,
  distillLegalStudent,
  type CompiledLegalStudentPolicy,
  type DistilledLegalStudent,
  type LegalStudentInput,
  type LegalTrainingRecord,
  type StudentAction,
} from "./distill.js"
export { assertTeacherSourceClosure, emitTeacherFactoryPacket, emitTeacherSource, type TeacherFactoryRequest } from "./emit.js"
