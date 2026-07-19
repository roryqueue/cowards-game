import { AuthClient } from "../auth-client.js"
import type { JSX } from "react"

export default function SignUpPage(): JSX.Element {
  return <AuthClient mode="sign-up" />
}
