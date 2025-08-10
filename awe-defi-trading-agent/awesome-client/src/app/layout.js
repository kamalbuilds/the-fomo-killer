import ClientLayout from '@/components/ClientLayout'
import "./globals.css"
import "../styles/animation.css"
import "../styles/colors.css"
import "../styles/common.css"
import "../styles/layout.css"


// export const metadata = {
//   title: 'AWESOME',
//   description: 'Autonomous World Engine Service via Open MCP Ecosystem.',
//   // icons: {
//   //   icon: '/awe.ico',
//   // },
// }


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>AWESOME</title>
        <meta name="description" content="Autonomous World Engine Service via Open MCP Ecosystem." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/awe.ico" type="image/x-icon" />

    
      </head>
      <body >     
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic'
