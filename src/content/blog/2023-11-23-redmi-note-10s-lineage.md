---
title: "Guide changing from MIUI to LineageOS on Redmi Note 10S"
description: "Complete step-by-step guide to unlock bootloader, install LineageOS recovery, and flash LineageOS on Redmi Note 10S smartphone."
date: 2023-11-23
comments: true
tags: ["android", "lineageos", "redmi"]
---

This guide will not take any responsibility of damage of one's property.

Pre-requisites:
1. Laptop/Desktop with USB 2.0 port (USB 3.0 is not supported i think)
2. At-least 40% battery
3. USB cable with data transfer capability
4. Redmi Note 10S device

Software Required:
1. Mi Unlock Tool
2. ADB / Fastboot driver (device specific)
3. Windows Command Prompt
4. Mi Flash Tool

Pre-cautions:
- Your device will be formatted, please keep a backup

Pre-Steps:
1. Go to settings
2. About Phone
3. Tap 5 times on MIUI Version (It will enable developer option)
4. Once developer option is enabled, go to Additional Settings and open developer options
5. Toggle OEM unlocking and Add account in "Mi Unlock status" (It will use your data)
6. Enable ADB debugging
7. Add adb drivers for your device on your computer

Steps to unlock boot-loader:
1. Ensure ADB is on
2. Open the Mi Unlock Tool
3. Login to your Mi Account linked with the device on the Mi Unlock Tool.It will start the process of verifying the account
4. Now, it will show you the time required to unlock the boot-loader
5. Wait till the time finishes
6. Do same process from Step 1
7. Then, it will lead to unlock button, upon clicking the button it will begin the process of unlocking the process of boot-loader unlock. It will format your device and get you back to base MIUI
8. Congrats your boot-loader has unlocked and can flash custom OS or previous version of MIUI and mods into it

# Steps to install Lineage OS:
1. Downgrading to Android version 13
2. Flashing Lineage OS recovery
3. Flashing Lineage OS
4. Optional: Flashing GAPPS

## Steps to Downgrading to Android version 13
1. Download the MIUI fastboot rom with android 13
2. Open fastboot mode `(Volume Down + Power)` on your device and connect the device to your computer
3. Open Mi Flash Tool and Select the downloaded rom
4. After connection is successful then showing, select the device
5. Click on flash button, it should now begin flashing the rom onto the device
6. After the flashing is complete then the device might reboot

## Steps to Flash Lineage OS Recovery
1. Download the `dtbo.img` from Lineage OS page for this device
2. Open fastboot mode `(Volume Down + Power)` on your device and connect the device to your computer
3. Flash the downloaded dtbo.img file using the command
    ```bash
    fastboot flash dtbo dtbo.img
    ```
4. You will now have flashed partitions required for lineage os
5. Download the Lineage OS recovery image for the device `boot.img`
6. Open fastboot mode `(Volume Down + Power)` on your device and connect the device to your computer
7. Flash the downloaded recovery image onto your device using the command:
    ```
    fastboot flash boot boot.img
    ```
8. Important: Now reboot your device into recovery mode using keys `(Volume Up + Power)`
9. If you see the Lineage OS logo then you are booted into Lineage OS recovery, else you have to again flash the recovery.

## Steps to Flash Lineage OS
1. Build the lineageOS installation package for your device (Process too long look here: [link](https://wiki.lineageos.org/devices/rosemary/build/variant1/)) and put the installation package onto your computer
2. Tap `Factory Reset`, then `Format Data/Factory Reset`.
3. Return to the Lineage Recovery's main menu
4. Select `Apply Update`, then `Apply from ADB`
5. Now Connect your device to the laptop, and put the command
    ```
    adb -d sideload installationPackage.zip
    ```
6. Lineage Recovery will inform you to reboot to recovery to install other addons. Select Yes if you want to install Gapps. I choose Yes

## Steps to Flashing GAPPS
1. Download the Google Apps (Gapps) package from [link](https://wiki.lineageos.org/gapps/)
2. Select `Apply Update`, then `Apply from ADB`
3. Now Connect your device to the laptop, and put the command
    ```
    adb -d sideload GappsPackage.zip
    ```
4. The screen will say Signature Verification failed. Click Yes
5. Reboot your system

### Completed Installing Lineage OS
