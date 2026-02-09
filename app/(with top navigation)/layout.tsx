export default function NavigationLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {


    return (
        <div>
            <div >
                {children}
            </div>
        </div>
    )
}