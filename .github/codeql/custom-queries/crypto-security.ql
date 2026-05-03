/**
 * @name Weak cryptographic algorithms
 * @description Weak cryptographic algorithms should not be used for sensitive data
 * @kind problem
 * @problem.severity error
 * @security-severity 9.0
 * @tags security
 *       cryptography
 *       weak-crypto
 */

import javascript

predicate weakCryptoAlgorithm(string algorithm) {
  algorithm = "md5" or
  algorithm = "sha1" or
  algorithm = "sha-1" or
  algorithm = "des" or
  algorithm = "rc4" or
  algorithm = "blowfish" or
  algorithm = "aes-128" or
  algorithm = "aes192" or
  algorithm = "aes256"
}

predicate strongCryptoAlgorithm(string algorithm) {
  algorithm = "sha256" or
  algorithm = "sha-256" or
  algorithm = "sha384" or
  algorithm = "sha-384" or
  algorithm = "sha512" or
  algorithm = "sha-512" or
  algorithm = "aes-256" or
  algorithm = "aes-256-gcm" or
  algorithm = "aes-256-cbc" or
  algorithm = "chacha20-poly1305"
}

from FunctionCall call, string algorithm
where
  call.getCalleeName() = "createHash" and
  call.getArgument(0).getStringValue() = algorithm and
  weakCryptoAlgorithm(algorithm)
select call, "Weak cryptographic algorithm '" + algorithm + "' detected. Use stronger algorithms like SHA-256 or SHA-512."
