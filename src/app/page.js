import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-[#443CA3] flex items-center justify-center px-6">
            <div className="max-w-5xl w-full text-center space-y-10">

                {/* ✅ Logo */}
                <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                        <Image
                            src="/logo-recupera-purple.png"
                            alt="Recupera Logo"
                            width={180}
                            height={80}
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Hero Title */}
                <div>
                    <h1
                        className="text-5xl font-extrabold text-[#FFFF76] mb-4"
                        style={{ fontFamily: "Neulis Alt" }}
                    >
                        Bienvenido a tu Portal de Recuperación de Deudas
                    </h1>

                    <p
                        className="text-lg text-[#CCE8FF] max-w-2xl mx-auto"
                        style={{ fontFamily: "Avenir Next" }}
                    >
                        Administra deudores, controla pagos y automatiza recordatorios —
                        todo desde un panel moderno diseñado para clientes y administradores.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">

                    {/* Login */}
                    <Link
                        href="/sign-in"
                        className="px-8 py-3 rounded-xl bg-[#21FE83] text-[#443CA3] font-bold shadow-lg hover:bg-[#1edb70] transition"
                        style={{ fontFamily: "Neulis Alt" }}
                    >
                        Iniciar Sesión
                    </Link>

                    {/* Sign Up */}
                    <Link
                        href="/sign-up"
                        className="px-8 py-3 rounded-xl border-2 border-[#CCE8FF] text-white font-semibold hover:bg-[#CCE8FF] hover:text-[#443CA3] transition"
                        style={{ fontFamily: "Avenir Next" }}
                    >
                        Crear Cuenta
                    </Link>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

                    {/* Feature Card */}
                    <div className="bg-[#CCE8FF] rounded-2xl shadow-md p-6 text-left space-y-3">
                        <h3
                            className="text-xl font-bold text-[#443CA3]"
                            style={{ fontFamily: "Neulis Alt" }}
                        >
                            Portal del Cliente
                        </h3>
                        <p
                            className="text-sm text-[#9E9E9E]"
                            style={{ fontFamily: "Avenir Next" }}
                        >
                            Registra deudores, revisa su estado y administra acuerdos de pago
                            desde una interfaz clara y profesional.
                        </p>
                    </div>

                    {/* Feature Card */}
                    <div className="bg-[#CCE8FF] rounded-2xl shadow-md p-6 text-left space-y-3">
                        <h3
                            className="text-xl font-bold text-[#443CA3]"
                            style={{ fontFamily: "Neulis Alt" }}
                        >
                            Recordatorios Automatizados
                        </h3>
                        <p
                            className="text-sm text-[#9E9E9E]"
                            style={{ fontFamily: "Avenir Next" }}
                        >
                            Automatiza correos, WhatsApp y llamadas para asegurar el seguimiento
                            de pagos atrasados de forma eficiente.
                        </p>
                    </div>

                    {/* Feature Card */}
                    <div className="bg-[#CCE8FF] rounded-2xl shadow-md p-6 text-left space-y-3">
                        <h3
                            className="text-xl font-bold text-[#443CA3]"
                            style={{ fontFamily: "Neulis Alt" }}
                        >
                            Panel Administrativo
                        </h3>
                        <p
                            className="text-sm text-[#9E9E9E]"
                            style={{ fontFamily: "Avenir Next" }}
                        >
                            Los administradores pueden supervisar clientes, actualizar estados
                            de deudas y controlar recordatorios globales del sistema.
                        </p>
                    </div>
                </div>

                {/* Footer Note */}
                {/* ✅ Footer */}
                <footer className="mt-16 border-t border-[#CCE8FF]/30 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#CCE8FF]">

                        {/* Left Side */}
                        <p
                            style={{ fontFamily: "Avenir Next" }}
                            className="text-center md:text-left"
                        >
                            © {new Date().getFullYear()}{" "}
                            <span className="font-bold text-[#FFFF76]">Recupera</span>.
                            Todos los derechos reservados.
                        </p>

                        {/* Footer Links */}
                        <div
                            className="flex flex-wrap justify-center gap-6"
                            style={{ fontFamily: "Avenir Next" }}
                        >
                            <a
                                href="/privacy"
                                className="hover:text-[#21FE83] transition"
                            >
                                Política de Privacidad
                            </a>

                            <a
                                href="/terms"
                                className="hover:text-[#21FE83] transition"
                            >
                                Términos y Condiciones
                            </a>

                            <a
                                href="/contact"
                                className="hover:text-[#21FE83] transition"
                            >
                                Contacto
                            </a>
                        </div>
                    </div>

                    {/* Bottom Line */}
                    <p
                        className="mt-6 text-xs text-center text-[#9E9E9E]"
                        style={{ fontFamily: "Avenir Next" }}
                    >
                        Plataforma diseñada para automatizar la recuperación de pagos de forma segura y eficiente.
                    </p>
                </footer>

            </div>
        </div>
    );
}
