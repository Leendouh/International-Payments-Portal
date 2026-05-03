/**
 * @name Missing input validation
 * @description User input should be validated before processing
 * @kind problem
 * @problem.severity warning
 * @security-severity 6.0
 * @tags security
 *       input-validation
 *       injection
 */

import javascript
import semmle.javascript.security.dataflow.TaintedObject

class UnvalidatedInput extends TaintedObject {
  UnvalidatedInput() {
    this = "UnvalidatedInput"
  }
  
  predicate isSource(DataFlow::Node source) {
    exists(Parameter p |
      p = source.asExpr() and
      p.getName().matches("%email%") or
      p.getName().matches("%password%") or
      p.getName().matches("%amount%") or
      p.getName().matches("%account%")
    ) or
    exists(PropertyAccess prop |
      prop = source.asExpr() and
      prop.getPropertyName() = "body" and
      prop.getBase().(Variable).getName() = "req"
    )
  }
  
  predicate isSink(DataFlow::Node sink) {
    exists(FunctionCall call |
      call = sink.asExpr() and
      (
        call.getCalleeName() = "query" or
        call.getCalleeName() = "send" or
        call.getCalleeName() = "write" or
        call.getCalleeName() = "exec" or
        call.getCalleeName() = "execute"
      )
    )
  }
  
  predicate isSanitizer(DataFlow::Node node) {
    exists(FunctionCall call |
      call = node.asExpr() and
      (
        call.getCalleeName().matches("%validate%") or
        call.getCalleeName().matches("%sanitize%") or
        call.getCalleeName().matches("%escape%") or
        call.getCalleeName().matches("%clean%")
      )
    )
  }
}

from UnvalidatedInput t, DataFlow::PathNode source, DataFlow::PathNode sink
where t.hasFlowPath(source, sink)
select sink.getNode(), source.getNode(), "Unvalidated user input $@ flows to sensitive operation without proper sanitization.", source.getNode(), "source"
