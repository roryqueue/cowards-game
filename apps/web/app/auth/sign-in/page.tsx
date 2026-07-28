import { AuthClient } from "../auth-client.js"
import type { JSX } from "react"

export default function SignInPage(): JSX.Element {
  return <AuthClient mode="sign-in" />
}
