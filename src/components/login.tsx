import { LoginForm } from './login-form'

type LoginProps = {
  tryAuth: (status: boolean) => void
}

function Login({
  tryAuth,
}: LoginProps) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm authenicate={tryAuth} />
        </div>
      </div>
    );
}

export default Login;
