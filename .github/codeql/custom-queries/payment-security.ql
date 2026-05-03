/**
 * @name Hardcoded payment amounts
 * @description Payment amounts should not be hardcoded in source code
 * @kind problem
 * @problem.severity error
 * @security-severity 7.5
 * @tags security
 *       payments
 *       financial
 */

import javascript
import semmle.javascript.security.dataflow.TaintedObject

class HardcodedPaymentAmount extends TaintedObject {
  HardcodedPaymentAmount() {
    this = "HardcodedPaymentAmount"
  }
  
  predicate isSource(DataFlow::Node source) {
    exists(FloatLiteral lit |
      lit = source.asExpr() and
      lit.getValue() > 0
    )
  }
  
  predicate isSink(DataFlow::Node sink) {
    exists(FunctionCall call |
      call = sink.asExpr() and
      call.getCalleeName().matches("%payment%") or
      call.getCalleeName().matches("%transaction%") or
      call.getCalleeName().matches("%amount%")
    )
  }
}

from HardcodedPaymentAmount t, DataFlow::PathNode source, DataFlow::PathNode sink
where t.hasFlowPath(source, sink)
select sink.getNode(), source.getNode(), "Hardcoded payment amount $@ flows to payment processing function.", source.getNode(), "value"
