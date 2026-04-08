"""
Deterministic policy-site render data generation.
"""
from datetime import date

from models import (
    PolicyQuestionAnswers,
    PolicyRenderData,
    PolicyDocumentRender,
    PolicyDocumentSection,
)


DATA_TYPE_LABELS = {
    "contact_info": {
        "en": "Contact details such as email address or support messages.",
        "zh": "联系方式，例如电子邮箱地址或客服沟通记录。",
    },
    "user_content": {
        "en": "Content you upload, submit, or otherwise provide inside the app.",
        "zh": "你在应用内上传、提交或提供的内容。",
    },
    "identifiers": {
        "en": "Identifiers related to your account, device, or app session.",
        "zh": "与你的账号、设备或应用会话相关的标识信息。",
    },
    "usage_data": {
        "en": "Usage and interaction data that helps operate and improve the service.",
        "zh": "用于运行和改进服务的使用和交互数据。",
    },
    "purchase_info": {
        "en": "Purchase and subscription information needed to provide paid features.",
        "zh": "提供付费功能所需的购买和订阅信息。",
    },
    "diagnostics": {
        "en": "Diagnostic and crash information used to troubleshoot issues.",
        "zh": "用于排查问题的诊断和崩溃信息。",
    },
}

SERVICE_LABELS = {
    "firebase": {"en": "Firebase", "zh": "Firebase"},
    "supabase": {"en": "Supabase", "zh": "Supabase"},
    "openai": {"en": "OpenAI", "zh": "OpenAI"},
    "anthropic": {"en": "Anthropic", "zh": "Anthropic"},
    "stripe": {"en": "Stripe", "zh": "Stripe"},
    "revenuecat": {"en": "RevenueCat", "zh": "RevenueCat"},
    "other": {"en": "Other third-party providers disclosed by the app team", "zh": "应用团队披露的其他第三方服务商"},
}


def normalize_answers(raw_answers: PolicyQuestionAnswers) -> PolicyQuestionAnswers:
    """Normalize mutually exclusive questionnaire fields before rendering."""
    answers = raw_answers.model_copy(deep=True)

    if not answers.collects_personal_data:
        answers.data_types = ["none"]
    elif "none" in answers.data_types:
        answers.data_types = ["none"]

    if "none" in answers.uses_third_party_services:
        answers.uses_third_party_services = ["none"]

    if not answers.has_account_creation:
        answers.allows_account_deletion = False

    return answers


def build_policy_render_data(raw_answers: PolicyQuestionAnswers) -> PolicyRenderData:
    """Build bilingual render data from a validated questionnaire."""
    answers = normalize_answers(raw_answers)
    return PolicyRenderData(
        privacy={
            "en": build_privacy_document(answers, "en"),
            "zh": build_privacy_document(answers, "zh"),
        },
        terms={
            "en": build_terms_document(answers, "en"),
            "zh": build_terms_document(answers, "zh"),
        },
    )


def build_privacy_document(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentRender:
    company = answers.company_name
    app_name = answers.app_name
    effective_date = format_policy_date(answers.effective_date, locale)

    sections = [
        build_privacy_collection_section(answers, locale),
        build_privacy_usage_section(answers, locale),
        build_privacy_service_section(answers, locale),
        build_privacy_retention_section(app_name, locale),
        build_privacy_choices_section(answers, locale),
        build_changes_section("privacy", app_name, locale),
        build_contact_section(company, answers.support_email, answers.website_url, locale),
    ]

    return PolicyDocumentRender(
        title="Privacy Policy" if locale == "en" else "隐私政策",
        effective_date_label="Effective date" if locale == "en" else "生效日期",
        effective_date_value=effective_date,
        intro=(
            f"{company} provides {app_name} and is responsible for how information is handled when you use the app."
            if locale == "en"
            else f"{company} 提供 {app_name}，并负责你在使用该应用时信息的处理方式。"
        ),
        sections=sections,
        contact_email=answers.support_email,
        website_url=answers.website_url,
    )


def build_terms_document(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentRender:
    company = answers.company_name
    app_name = answers.app_name
    effective_date = format_policy_date(answers.effective_date, locale)

    sections = [
        build_terms_acceptance_section(company, app_name, locale),
        build_terms_account_section(answers, locale),
        build_terms_usage_section(app_name, locale),
        build_terms_content_section(company, locale),
        build_terms_disclaimer_section(locale),
        build_terms_termination_section(locale),
        build_changes_section("terms", app_name, locale),
        build_contact_section(company, answers.support_email, answers.website_url, locale),
    ]

    return PolicyDocumentRender(
        title="Terms of Service" if locale == "en" else "服务条款",
        effective_date_label="Effective date" if locale == "en" else "生效日期",
        effective_date_value=effective_date,
        intro=(
            f"These Terms of Service govern your access to and use of {app_name}."
            if locale == "en"
            else f"本服务条款适用于你对 {app_name} 的访问和使用。"
        ),
        sections=sections,
        contact_email=answers.support_email,
        website_url=answers.website_url,
    )


def build_privacy_collection_section(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentSection:
    heading = "Information We Collect" if locale == "en" else "我们收集的信息"
    if not answers.collects_personal_data or answers.data_types == ["none"] or not answers.data_types:
        paragraph = (
            "We do not intentionally collect personal data beyond what is necessary to provide the app and respond to support requests."
            if locale == "en"
            else "除提供应用服务和处理客服请求所必需的信息外，我们不会主动收集个人数据。"
        )
        return PolicyDocumentSection(heading=heading, paragraphs=[paragraph])

    bullets = [DATA_TYPE_LABELS[data_type][locale] for data_type in answers.data_types if data_type in DATA_TYPE_LABELS]
    paragraph = (
        "Depending on how you use the app, we may collect the following categories of information:"
        if locale == "en"
        else "根据你使用应用的方式，我们可能会收集以下类别的信息："
    )
    return PolicyDocumentSection(heading=heading, paragraphs=[paragraph], bullets=bullets)


def build_privacy_usage_section(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentSection:
    bullets = []
    if locale == "en":
        bullets.append("Operate, maintain, and improve the app.")
        if answers.has_account_creation:
            bullets.append("Create and manage your account, including authentication and account recovery.")
        if answers.collects_personal_data:
            bullets.append("Provide requested features, support, and service communications.")
        bullets.append("Protect the app, users, and infrastructure against misuse or security incidents.")
    else:
        bullets.append("运行、维护并改进应用。")
        if answers.has_account_creation:
            bullets.append("创建和管理你的账号，包括身份验证和账号恢复。")
        if answers.collects_personal_data:
            bullets.append("提供你请求的功能、支持服务和服务通知。")
        bullets.append("保护应用、用户和基础设施，防止滥用或安全事件。")

    return PolicyDocumentSection(
        heading="How We Use Information" if locale == "en" else "我们如何使用信息",
        paragraphs=[
            "We use information collected through the app for the following purposes:"
            if locale == "en"
            else "我们会将通过应用收集的信息用于以下目的："
        ],
        bullets=bullets,
    )


def build_privacy_service_section(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentSection:
    heading = "Third-Party Services" if locale == "en" else "第三方服务"
    if answers.uses_third_party_services == ["none"] or not answers.uses_third_party_services:
        paragraph = (
            "We do not currently disclose personal data to named third-party services except as needed to operate the app."
            if locale == "en"
            else "除运行应用所必需的情况外，我们目前不会向已命名的第三方服务披露个人数据。"
        )
        return PolicyDocumentSection(heading=heading, paragraphs=[paragraph])

    bullets = [
        SERVICE_LABELS[service][locale]
        for service in answers.uses_third_party_services
        if service in SERVICE_LABELS
    ]
    paragraph = (
        "The app may rely on the following third-party service providers to support its features and operations:"
        if locale == "en"
        else "该应用可能会依赖以下第三方服务提供商来支持其功能和运营："
    )
    return PolicyDocumentSection(heading=heading, paragraphs=[paragraph], bullets=bullets)


def build_privacy_retention_section(app_name: str, locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Data Retention and Security" if locale == "en" else "数据保存与安全",
        paragraphs=[
            (
                f"We keep information for as long as reasonably necessary to provide {app_name}, comply with legal obligations, resolve disputes, and enforce our agreements."
                if locale == "en"
                else f"我们会在为提供 {app_name}、履行法律义务、解决争议和执行协议而合理必要的期限内保存相关信息。"
            ),
            (
                "We use reasonable administrative, technical, and organizational measures to protect information, but no system can be guaranteed to be completely secure."
                if locale == "en"
                else "我们会采用合理的管理、技术和组织措施保护相关信息，但任何系统都无法保证绝对安全。"
            ),
        ],
    )


def build_privacy_choices_section(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentSection:
    bullets = []
    if locale == "en":
        bullets.append("Contact us if you need access to, correction of, or deletion of your information.")
        if answers.has_account_creation and answers.allows_account_deletion:
            bullets.append("You can request deletion of your account and associated data using the support contact listed below.")
        elif answers.has_account_creation:
            bullets.append("If account deletion is not available in-app, you can still contact support with account-related requests.")
        bullets.append(f"This policy applies to users in {answers.countries_or_region_scope}.")
    else:
        bullets.append("如果你需要访问、更正或删除你的信息，可以联系我们。")
        if answers.has_account_creation and answers.allows_account_deletion:
            bullets.append("你可以通过下方的客服联系方式申请删除账号及相关数据。")
        elif answers.has_account_creation:
            bullets.append("如果应用内暂不支持删除账号，你仍可以联系客服处理账号相关请求。")
        bullets.append(f"本政策适用于 {answers.countries_or_region_scope} 的用户。")

    return PolicyDocumentSection(
        heading="Your Choices" if locale == "en" else "你的选择",
        paragraphs=[
            "You may have privacy rights depending on your location and how you use the service."
            if locale == "en"
            else "根据你所在地区以及你使用服务的方式，你可能享有相应的隐私权利。"
        ],
        bullets=bullets,
    )


def build_terms_acceptance_section(company: str, app_name: str, locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Acceptance of Terms" if locale == "en" else "条款接受",
        paragraphs=[
            (
                f"By accessing or using {app_name}, you agree to these Terms of Service with {company}. If you do not agree, do not use the app."
                if locale == "en"
                else f"当你访问或使用 {app_name} 时，即表示你同意与 {company} 之间的本服务条款；如果你不同意，请不要使用该应用。"
            )
        ],
    )


def build_terms_account_section(answers: PolicyQuestionAnswers, locale: str) -> PolicyDocumentSection:
    heading = "Accounts and Eligibility" if locale == "en" else "账号与使用资格"
    if answers.has_account_creation:
        paragraphs = [
            (
                "You are responsible for maintaining the confidentiality of your account credentials and for activities that occur under your account."
                if locale == "en"
                else "你有责任妥善保管账号凭证，并对账号下发生的活动负责。"
            ),
            (
                "You must provide accurate information when creating an account and keep it reasonably up to date."
                if locale == "en"
                else "在创建账号时，你应提供真实、准确的信息，并在合理范围内保持更新。"
            ),
        ]
    else:
        paragraphs = [
            (
                "The app may be used without creating a persistent user account, but you must still comply with these Terms of Service."
                if locale == "en"
                else "该应用可能无需创建持久账号即可使用，但你仍需遵守本服务条款。"
            )
        ]
    return PolicyDocumentSection(heading=heading, paragraphs=paragraphs)


def build_terms_usage_section(app_name: str, locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Acceptable Use" if locale == "en" else "可接受的使用方式",
        paragraphs=[
            (
                f"You may use {app_name} only in compliance with applicable law and these terms."
                if locale == "en"
                else f"你只能在遵守适用法律和本条款的前提下使用 {app_name}。"
            )
        ],
        bullets=[
            "Do not misuse the service, attempt unauthorized access, or interfere with normal operation."
            if locale == "en"
            else "不得滥用服务、尝试未经授权的访问，或干扰服务的正常运行。",
            "Do not upload or distribute content that infringes the rights of others or violates law."
            if locale == "en"
            else "不得上传或传播侵犯他人权利或违反法律的内容。",
        ],
    )


def build_terms_content_section(company: str, locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Content and Intellectual Property" if locale == "en" else "内容与知识产权",
        paragraphs=[
            (
                f"You retain rights in content you provide, but grant {company} the limited rights needed to host, process, and deliver the service."
                if locale == "en"
                else f"你保留对自己提供内容的权利，但授予 {company} 为托管、处理和提供服务所必需的有限权利。"
            ),
            (
                "The app, including its software, branding, and service materials, remains protected by applicable intellectual property laws."
                if locale == "en"
                else "该应用及其软件、品牌和服务材料仍受适用知识产权法律保护。"
            ),
        ],
    )


def build_terms_disclaimer_section(locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Disclaimers and Limitation of Liability" if locale == "en" else "免责声明与责任限制",
        paragraphs=[
            (
                "The service is provided on an \"as is\" and \"as available\" basis. To the maximum extent permitted by law, we disclaim warranties not expressly stated in these terms."
                if locale == "en"
                else "服务按“现状”和“可用”基础提供。在法律允许的最大范围内，我们不提供本条款未明确列出的保证。"
            ),
            (
                "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service."
                if locale == "en"
                else "在法律允许的最大范围内，对于因你使用服务而产生的间接、附带、特殊、后果性或惩罚性损害，我们不承担责任。"
            ),
        ],
    )


def build_terms_termination_section(locale: str) -> PolicyDocumentSection:
    return PolicyDocumentSection(
        heading="Suspension and Termination" if locale == "en" else "暂停与终止",
        paragraphs=[
            (
                "We may suspend or terminate access if you materially violate these terms or if continued operation of the service becomes impractical or unlawful."
                if locale == "en"
                else "如果你严重违反本条款，或服务继续运营变得不切实际或不合法，我们可以暂停或终止你的访问权限。"
            )
        ],
    )


def build_changes_section(document_type: str, app_name: str, locale: str) -> PolicyDocumentSection:
    title = "Changes to This Policy" if document_type == "privacy" and locale == "en" else None
    if document_type == "privacy" and locale == "zh":
        title = "本政策的变更"
    elif document_type == "terms" and locale == "en":
        title = "Changes to These Terms"
    elif document_type == "terms" and locale == "zh":
        title = "本条款的变更"

    paragraph = (
        f"We may update this {'Privacy Policy' if document_type == 'privacy' else 'Terms of Service'} for {app_name} from time to time. The updated version will be posted on this page with a revised effective date."
        if locale == "en"
        else f"我们可能会不时更新 {app_name} 的{'隐私政策' if document_type == 'privacy' else '服务条款'}。更新后的版本会发布在本页面，并显示新的生效日期。"
    )
    return PolicyDocumentSection(heading=title, paragraphs=[paragraph])


def build_contact_section(company: str, support_email: str, website_url: str | None, locale: str) -> PolicyDocumentSection:
    paragraphs = [
        (
            f"If you have questions about this document, contact {company} at {support_email}."
            if locale == "en"
            else f"如果你对本文件有任何疑问，请通过 {support_email} 联系 {company}。"
        )
    ]
    if website_url:
        paragraphs.append(
            f"Website: {website_url}" if locale == "en" else f"网站：{website_url}"
        )

    return PolicyDocumentSection(
        heading="Contact Us" if locale == "en" else "联系我们",
        paragraphs=paragraphs,
    )


def format_policy_date(value: date, locale: str) -> str:
    if locale == "zh":
        return f"{value.year}年{value.month}月{value.day}日"
    return f"{value.strftime('%B')} {value.day}, {value.year}"
