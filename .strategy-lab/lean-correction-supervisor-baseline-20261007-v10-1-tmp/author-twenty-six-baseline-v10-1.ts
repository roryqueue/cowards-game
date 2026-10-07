/** MAIN fresh baseline metadata only; no Match, entry or reader commands. */
import { readFileSync, existsSync, lstatSync, realpathSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { labRoot, type LabRoot } from '../../packages/strategy-lab/src/contracts.js'
import { LEAN_BASELINE_STORE, LEAN_TWENTY_SIX_V10_EXTENSION, leanBytesRoot, leanCanonicalBytes, leanCorrectionRoutePaths } from '../../packages/strategy-lab/src/league/lean-experiment.js'
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY } from '../../scripts/lib/v1-38-lean-baseline-reuse.js'
import { authenticateLeanSupervisorDiagnosticCheck, authenticateLeanRetryClosureV8 } from '../../scripts/lib/v1-38-lean-correction-retained.js'
import { leanRemainingDocumentsV9, readLeanRetrySetupWitnessV8, createLeanRemainingRequestDraftV9, leanCorrectionSourceManifest, leanCorrectionRequestDataRoot, readLeanCorrectionJson, readLeanRemainingRequestV9, publishLeanCorrection, type LeanCorrectionRequest } from '../../scripts/run-v1-38-lean-correction.js'
const mode='v10-1' as const, route='baseline' as const, attemptOrdinal=1
const sourceRoot:LabRoot='sha256:26c1befe2d2e214f8b1b50adc30292d4a9f4cede72e8fc3d6e8499a652161ab1'
const reviewerAgent='/root/review_265_v10_baseline_data'
const acceptedCheckRoot:LabRoot='sha256:23564b5d90fdf8e4bde2c004b052be5bc24804742db5466c6c41985a394ad6b2'
const acceptedReaderCloseRoot:LabRoot='sha256:91213587cc5e89f94a1f479734ac9587197f9188670bc16027cc53f7b74ed096'
const b=LEAN_TWENTY_SIX_V10_EXTENSION, docs=leanRemainingDocumentsV9(route,mode), paths=leanCorrectionRoutePaths(route,mode)
const action=process.argv[2],temp=resolve(paths.temp),stat=lstatSync(temp),draftPath=join(temp,'draft-request.json')
if(process.argv.length!==3||!['draft','finalize'].includes(action!))throw new Error('AUTHOR_MODE')
if(!stat.isDirectory()||stat.isSymbolicLink()||stat.uid!==process.getuid?.()||(stat.mode&0o777)!==0o700||realpathSync(temp)!==temp||leanCorrectionSourceManifest(mode,b).root!==sourceRoot)throw new Error('AUTHOR_CUSTODY')
if(action==='draft'){
  if([paths.request,paths.store,paths.allocation,draftPath,docs.authorization].some(p=>existsSync(p)))throw new Error('AUTHOR_SPENT')
  const setup=readLeanRetrySetupWitnessV8(mode),accepted=authenticateLeanSupervisorDiagnosticCheck(mode),closed=authenticateLeanRetryClosureV8(mode)
  if(accepted.root!==acceptedCheckRoot||closed.root!==acceptedReaderCloseRoot||closed.finalReaderClose!==true||closed.closureClass!=='accepted'||closed.sourceRoot!==sourceRoot||closed.checkRoot!==accepted.root||closed.readerCloseMs!==accepted.readerCloseMs)throw new Error('AUTHOR_NEW_FINAL')
  const reuse=authenticateLeanColdReuse({directory:LEAN_BASELINE_STORE,newSourceRoot:sourceRoot,amendmentRoot:LEAN_COLD_REUSE_HISTORY.amendmentRoot}),placeholder=labRoot('non-authorizing-v10-baseline-draft-placeholder',{}),reviewRoot=leanBytesRoot(readFileSync(docs.review))
  const request=createLeanRemainingRequestDraftV9(mode,route,{sourceRoot,reviewRoot,dataReviewRoot:placeholder,setupAccountingRoot:setup.root,reuseGrantRoot:reuse.grant.root,authorizationRoot:placeholder,priorClosureRoot:null,continuationRoot:null,acceptedCheckRoot,acceptedReaderCloseRoot})
  publishLeanCorrection(draftPath,request)
  process.stdout.write(JSON.stringify({status:'draft_only',authorAgent:'/root',route,attemptOrdinal,sourceRoot,requestDataRoot:leanCorrectionRequestDataRoot(request),acceptedCheckRoot,acceptedReaderCloseRoot,plannedCells:request.requestRoots.length})+'\n')
}else{
  const request=readLeanCorrectionJson(draftPath) as LeanCorrectionRequest,dataRoot=leanCorrectionRequestDataRoot(request),review=readFileSync(docs.dataReview),front=review.toString('utf8').split('\n---',2)[0]!
  const field=(key:string)=>front.match(new RegExp(`^${key}: ([^\\n]+)$`,'mu'))?.[1]?.replace(/^['"]|['"]$/gu,'')
  if(!front.startsWith('---\n')||field('status')!=='clean'||field('independently_reviewed')!=='true'||field('request_root')!==dataRoot||field('source_root')!==sourceRoot||field('author_agent')!=='/root'||field('reviewer_agent')!==reviewerAgent||request.route!==route||request.attemptOrdinal!==attemptOrdinal||request.diagnosis!==null||request.acceptedCheckRoot!==acceptedCheckRoot||request.acceptedReaderCloseRoot!==acceptedReaderCloseRoot||request.priorClosureRoot!==null||request.continuationRoot!==null)throw new Error('AUTHOR_REVIEW')
  const body={schemaVersion:'lean-retry-execution-authorization-v8',approved:true,executionAuthorized:true,route,attemptOrdinal,sourceRoot,approvalRoot:b.approvalRoot,planRoot:b.planRoot,policyRoot:b.root,requestDataRoot:dataRoot,authorAgent:'/root',reviewerAgent,timeboxExtension:b},authorization={...body,root:labRoot(body.schemaVersion,body)}
  const final={...request,dataReviewRoot:leanBytesRoot(review),authorizationRoot:leanBytesRoot(leanCanonicalBytes(authorization))}
  if(leanCorrectionRequestDataRoot(final)!==dataRoot)throw new Error('AUTHOR_ROOT')
  publishLeanCorrection(docs.authorization,authorization);publishLeanCorrection(paths.request,final)
  readLeanRemainingRequestV9(paths.request,route,mode)
  process.stdout.write(JSON.stringify({status:'request_only',route,attemptOrdinal,requestDataRoot:dataRoot,requestBytesRoot:leanBytesRoot(readFileSync(paths.request))})+'\n')
}
