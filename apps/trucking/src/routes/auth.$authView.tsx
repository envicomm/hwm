import { AuthView } from "@daveyplate/better-auth-ui";
import { createFileRoute } from "@tanstack/react-router";
import {
	Truck,
	Shield,
	FileText,
	BarChart3,
	Route as RouteIcon,
	Clock,
	CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/auth/$authView")({
	component: AuthPage,
});

function AuthPage() {
	const { authView } = Route.useParams();

	return (
		<div className="min-h-screen flex flex-col lg:flex-row">
			{/* Left Hero Panel - Industrial Dark */}
			<div className="relative flex-1 bg-hero overflow-hidden">
				{/* Grid Pattern Overlay */}
				<div className="absolute inset-0 hero-grid" />

				{/* Noise Texture */}
				<div className="absolute inset-0 noise-overlay" />

				{/* Accent Line at Top */}
				<div className="accent-line absolute top-0 left-0 right-0 h-1 z-20" />

				{/* Decorative Route Lines */}
				<svg
					className="absolute inset-0 w-full h-full opacity-[0.03]"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<pattern
							id="route-pattern"
							x="0"
							y="0"
							width="200"
							height="200"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M0 100 Q50 50, 100 100 T200 100"
								stroke="currentColor"
								strokeWidth="2"
								fill="none"
								className="text-hero-foreground"
							/>
							<circle
								cx="0"
								cy="100"
								r="4"
								fill="currentColor"
								className="text-primary"
							/>
							<circle
								cx="100"
								cy="100"
								r="4"
								fill="currentColor"
								className="text-primary"
							/>
							<circle
								cx="200"
								cy="100"
								r="4"
								fill="currentColor"
								className="text-primary"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#route-pattern)" />
				</svg>

				{/* Gradient Orbs */}
				<div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
				<div className="absolute top-1/4 -right-16 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />

				{/* Content */}
				<div className="relative z-10 flex flex-col justify-between h-full p-8 lg:p-12 xl:p-16 text-hero-foreground">
					{/* Logo */}
					<div className="animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both">
						<div className="flex items-center gap-3 mb-3">
							<div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 backdrop-blur-sm">
								<Truck className="w-5 h-5 text-primary" />
							</div>
							<div>
								<span className="text-xl font-bold tracking-tight block">
									HWM<span className="text-primary">Haul</span>
								</span>
								<span className="text-hero-muted text-[10px] uppercase tracking-[0.2em] font-medium">
									Transport Division
								</span>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="py-8 lg:py-0 space-y-8">
						{/* Badge */}
						<div
							className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
							style={{ animationDelay: "100ms" }}
						>
							<div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
							Hazardous Waste Transport Portal
						</div>

						{/* Headline */}
						<div className="space-y-4">
							<h1
								className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
								style={{ animationDelay: "200ms" }}
							>
								Precision Hauling
								<br />
								<span className="text-primary">Operations</span>
							</h1>
							<p
								className="text-hero-muted text-base lg:text-lg max-w-lg leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700 fill-mode-both"
								style={{ animationDelay: "300ms" }}
							>
								Coordinate pickups, optimize routes, track manifests, and
								maintain full regulatory compliance across your hazardous waste
								transport network.
							</p>
						</div>

						{/* Feature Cards */}
						<div className="grid grid-cols-2 gap-3 max-w-lg">
							{[
								{
									icon: RouteIcon,
									label: "Route Optimization",
									desc: "AI-powered scheduling",
								},
								{
									icon: FileText,
									label: "Manifest Tracking",
									desc: "Digital documentation",
								},
								{
									icon: Shield,
									label: "Compliance Ready",
									desc: "EPA & DOT certified",
								},
								{
									icon: BarChart3,
									label: "Live Analytics",
									desc: "Real-time insights",
								},
							].map((feature, i) => (
								<div
									key={feature.label}
									className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
									style={{ animationDelay: `${400 + i * 100}ms` }}
								>
									<div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors flex-shrink-0">
										<feature.icon className="w-4 h-4 text-primary" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-medium text-hero-foreground truncate">
											{feature.label}
										</p>
										<p className="text-xs text-hero-muted truncate">
											{feature.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Footer Stats */}
					<div
						className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm animate-in fade-in duration-1000 fill-mode-both"
						style={{ animationDelay: "800ms" }}
					>
						<div className="flex items-center gap-2 text-hero-muted">
							<CheckCircle2 className="w-4 h-4 text-primary" />
							<span>EPA Compliant</span>
						</div>
						<div className="flex items-center gap-2 text-hero-muted">
							<CheckCircle2 className="w-4 h-4 text-primary" />
							<span>DOT Certified</span>
						</div>
						<div className="flex items-center gap-2 text-hero-muted">
							<Clock className="w-4 h-4 text-primary" />
							<span>24/7 Dispatch</span>
						</div>
					</div>
				</div>
			</div>

			{/* Right Auth Panel */}
			<div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col bg-background relative">
				{/* Subtle Grid Background */}
				<div
					className="absolute inset-0 opacity-[0.015]"
					style={{
						backgroundImage: `
							linear-gradient(to right, currentColor 1px, transparent 1px),
							linear-gradient(to bottom, currentColor 1px, transparent 1px)
						`,
						backgroundSize: "32px 32px",
					}}
				/>

				{/* Top Bar - Mobile Logo */}
				<div className="relative z-10 flex justify-between items-center p-6 lg:p-8">
					<div className="lg:hidden flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
							<Truck className="w-4 h-4 text-primary-foreground" />
						</div>
						<span className="font-bold text-lg">
							HWM<span className="text-primary">Haul</span>
						</span>
					</div>
					<div className="hidden lg:block" />
				</div>

				{/* Auth Form Container */}
				<div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12 lg:px-10">
					<div
						className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both"
						style={{ animationDelay: "200ms" }}
					>
						<AuthView pathname={authView} />
					</div>
				</div>

				{/* Bottom Accent Line */}
				<div className="h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
			</div>
		</div>
	);
}
