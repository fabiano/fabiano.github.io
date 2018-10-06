# Automate the IIS configuration with PowerShell

Creating a new website on the IIS is something easy to do with the Internet Information Services (IIS) Manager. Just a few clicks and your website is configured and running.

This changes when you have to create more than one website with the same configuration. You will have to repeat the same steps over and over.

Luckily, you can use the Web Server Administration module (WebAdministration) to automate the process. This module includes several cmdlets that let you manage the configuration and run-time data of IIS.

The module also implements a virtual drive named `IIS` that you can use to access the application pools (AppPools), websites (Sites), and SSL bindings (SslBindings) like a file system drive.

The cmdlets can be used inside scripts or in the command line. We will start with the former. Open an elevated PowerShell prompt and type the command:

```powershell
> Import-Module WebAdministration
```

You can use the `Get-ChildItem` cmdlet to list some items.

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

Now that the module was loaded you can move forward.

## Creating a website

To get used to the cmdlets, begin creating a simple website.

```powershell
> New-Item -Type "Directory" -Path "C:\inetpub\wwwroot\demo01"
> New-Item -ItemType "File" -Path "C:\inetpub\wwwroot\demo01\index.html" -Value "It's Alive!"
> New-Website -Name "demo01" -Port 8080 -PhysicalPath "C:\inetpub\wwwroot\demo01"
```

Open the browser and type `http://localhost:8080`. You should see the message `It's Alive!`

The `New-Website` cmdlet creates and starts a new website with the name, port, and path specified. The `DefaultAppPool` will be used by default. To specify a custom pool you can use the `-ApplicationPool` param.

You can extend the example using the `New-WebAppPool` cmdlet to create a new pool.

```powershell
> New-Item -Type "Directory" -Path "C:\inetpub\wwwroot\demo02"
> New-Item -ItemType "File" -Path "C:\inetpub\wwwroot\demo02\index.html" -Value "It's Alive!"
> New-WebAppPool -Name "demo02-pool"
> New-Website -Name "demo02" -Port 8081 -ApplicationPool "demo02-pool" -PhysicalPath "C:\inetpub\wwwroot\demo02"
```

And customize the pool properties using the `Set-ItemProperty` cmdlet.

```powershell
> Set-ItemProperty -Path "IIS:\AppPools\demo02-pool" -Name "managedRuntimeVersion" -Value "v4.0"
> Set-ItemProperty -Path "IIS:\AppPools\demo02-pool" -Name "managedPipelineMode" -Value "Integrated"
```

Here you can find a list of all available properties: https://docs.microsoft.com/en-us/iis/configuration/system.applicationHost/applicationPools/add/#configuration

## Writing your first script

Now that you know some cmdlets and how to use them, it is time to write your first script. Open your favorite editor, copy and paste the code below, and save the script with the name `create-website.ps1`.

```powershell
param
(
  [string]$Name,
  [int]$Port
)

Import-Module WebAdministration

New-Item -Type "Directory" -Path "C:\inetpub\wwwroot\$Name"
New-Item -ItemType "File" -Path "C:\inetpub\wwwroot\$Name\index.html" -Value "It's Alive!"
New-WebAppPool -Name "$Name"
New-Website -Name "$Name" -Port $Port -ApplicationPool "$Name" -PhysicalPath "C:\inetpub\wwwroot\$Name"
```

As you can see, there is nothing special with this script. It is the same cmdlets that we used in the previous examples. You can execute the script by typing in the command line:

```powershell
> .\create-website.ps1 -Name "demo03" -Port 8082
```


