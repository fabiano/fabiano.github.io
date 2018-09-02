# Automate the IIS configuration with PowerShell

Create a new website on the IIS is something easy to do with the Internet Information Services (IIS) Manager. Just a few clicks and we have your website configured and running.

This changes when we have to create more than one website with the same configuration. We will have to repeat the same steps over and over.

Luckily, we can use the Web Server Administration module (WebAdministration) to automate the process. This module includes several cmdlets that let we manage the configuration and run-time data of IIS.

We can use these cmdlets inside your scripts or from the command line. Let's start with the former. Open an elevated PowerShell prompt and type the command:

```powershell
> Import-Module WebAdministration
```

The module implements a virtual drive named `IIS` that we can use to manage the application pools (AppPools), websites (Sites), and SSL bindinds (SslBindings). We can use the `Get-ChildItem` cmdlet to list some items.

```powershell
> Get-ChildItem IIS:\\

Name
----
AppPools
Sites
SslBindings

> Get-ChildItem IIS:\\AppPools

Name                     State        Applications
----                     -----        ------------
DefaultAppPool           Started      Default Web Site

> Get-ChildItem IIS:\\Sites

Name             ID   State      Physical Path                  Bindings
----             --   -----      -------------                  --------
Default Web Site 1    Started    %SystemDrive%\inetpub\wwwroot  http *:80:
```

Now that the module was loaded we can move forward.

## Creating a website

Let's start creating a simple website to get used with the commands.

```powershell
> New-Item -Type "Directory" -Path "C:\inetpub\wwwroot\demo01"
> New-Item -ItemType "File" -Path "C:\inetpub\wwwroot\demo01\index.html" -Value "It's Alive!"
> New-Website -Name "demo01" -Port 8080 -PhysicalPath "C:\inetpub\wwwroot\demo01"
```

Open the browser and type `http://localhost:8080`. You should see the message `It's Alive!`.

The `New-Website` cmdlet creates and starts a new website with the name, port, and path specified. The `DefaultAppPool` will be used by default. To specify a custom pool we can use the `-ApplicationPool` param.

We can extend our example using the `New-WebAppPool` cmdlet to create a new pool.

```powershell
> New-Item -Type "Directory" -Path "C:\inetpub\wwwroot\demo02"
> New-Item -ItemType "File" -Path "C:\inetpub\wwwroot\demo02\index.html" -Value "It's Alive!"
> New-WebAppPool -Name "demo02"
> New-Website -Name "demo02" -Port 8081 -ApplicationPool "demo02" -PhysicalPath "C:\inetpub\wwwroot\demo02"
```

You can customize the pool properties using the `Set-ItemProperty` cmdlet.

```powershell
> Set-ItemProperty -Path "IIS:\AppPools\demo02" -Name "managedRuntimeVersion" -Value "v4.0"
> Set-ItemProperty -Path "IIS:\AppPools\demo02" -Name "managedPipelineMode" -Value "Integrated"
```

Here you can find a list of all available properties: https://docs.microsoft.com/en-us/iis/configuration/system.applicationHost/applicationPools/add/#configuration

## Writing our first script

